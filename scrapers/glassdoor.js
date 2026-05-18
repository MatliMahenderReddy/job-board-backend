// ======================================================
// GLASSDOOR SCRAPER
// ======================================================

const { preparePage, safeText, retry } = require("./utils");

async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
  const page = await browser.newPage();
  await preparePage(page);
  let allJobs = [];

  try {
    const p = targetPage;
    const encodedKeyword = encodeURIComponent(keyword.replace(/\s+/g, "-"));
    const encodedLocation = encodeURIComponent(location.replace(/\s+/g, "-"));
    const url = `https://www.glassdoor.com/Job/${encodedLocation}-${encodedKeyword}-jobs-SRCH_IL.0,${encodedLocation.length}_IN1_KO${encodedLocation.length + 1},${encodedLocation.length + 1 + encodedKeyword.length}.htm?p=${p}`;

    onProgress(`Page ${p}: ${url}`);

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout });
        await page.waitForSelector('[data-test="jobListing"]', { timeout: 20000 });

        const jobs = await page.$$eval('[data-test="jobListing"]', (cards) =>
          cards.map((card) => {
            const anchor = card.querySelector('a[data-test="job-title"]') || card.querySelector('.job-title a');
            const link = anchor ? ("https://www.glassdoor.com" + (anchor.getAttribute("href") || "")) : "";

            return {
              title: anchor?.innerText?.trim() || card.querySelector('.job-title')?.innerText?.trim() || "",
              company: card.querySelector('[data-test="employer-name"]')?.innerText?.trim() || "",
              location: card.querySelector('[data-test="emp-location"]')?.innerText?.trim() || "",
              salary: card.querySelector('[data-test="detailSalary"]')?.innerText?.trim() || "",
              posted: card.querySelector('[data-test="job-age"]')?.innerText?.trim() || "",
              jobType: card.querySelector('[data-test="job-type"]')?.innerText?.trim() || "",
              rating: card.querySelector('[data-test="rating"]')?.innerText?.trim() || "",
              link,
            };
          })
        );

        if (jobs.length) {
          allJobs.push(...jobs);
        }
      } catch (err) {
        onProgress(`Page ${p} failed: ${err.message}`);
      }
  } finally {
    await page.close();
  }

  return dedup(allJobs);
}

async function scrapeDetail({ browser, job, timeout, retries }) {
  if (!job.link) return null;

  const page = await browser.newPage();
  await preparePage(page);

  try {
    const ok = await retry(async () => {
      await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
      await page.waitForSelector('[data-test="jobDescriptionContent"]', { timeout: 15000 });
    }, retries);

    if (!ok) return null;

    job.description = await safeText(page, '[data-test="jobDescriptionContent"]');

    return job;
  } catch {
    return null;
  } finally {
    await page.close();
  }
}

function dedup(jobs) {
  const map = new Map();
  for (const job of jobs) {
    const key = `${job.title}-${job.company}-${job.link}`;
    if (!map.has(key)) map.set(key, job);
  }
  return [...map.values()];
}

module.exports = { scrape, scrapeDetail };
