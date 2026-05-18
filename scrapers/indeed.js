// ======================================================
// INDEED SCRAPER
// ======================================================

const { preparePage, safeText, retry } = require("./utils");

async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
  const page = await browser.newPage();
  await preparePage(page);
  let allJobs = [];

  try {
    const p = targetPage - 1;
    const params = new URLSearchParams({
      q: keyword,
      l: location,
      start: p * 10,
    });

    if (filters.datePosted) {
      const map = { "1": "1", "3": "3", "7": "7", "14": "14", "30": "30" };
      if (map[filters.datePosted]) params.set("fromage", map[filters.datePosted]);
    }
    if (filters.jobType) params.set("jt", filters.jobType);
    if (filters.remote) params.set("remotejob", "1");

    const url = `https://www.indeed.com/jobs?${params}`;
    onProgress(`Page ${targetPage}: ${url}`);

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout });
        await page.waitForSelector('[data-testid="slider_item"]', { timeout: 20000 });

        const jobs = await page.$$eval('[data-testid="slider_item"]', (cards) =>
          cards.map((card) => {
            const anchor = card.querySelector('h2 a');
            const link = anchor ? "https://www.indeed.com" + (anchor.getAttribute("href") || "") : "";

            return {
              title: card.querySelector('h2 span')?.innerText?.trim() || anchor?.innerText?.trim() || "",
              company: card.querySelector('[data-testid="company-name"]')?.innerText?.trim() || "",
              location: card.querySelector('[data-testid="text-location"]')?.innerText?.trim() || "",
              salary: card.querySelector('[data-testid="attribute_snippet_testid"]')?.innerText?.trim() || "",
              posted: card.querySelector('[data-testid="myJobsStateDate"]')?.innerText?.trim() || "",
              jobType: "",
              link,
            };
          })
        );

      if (jobs.length) {
        allJobs.push(...jobs);
      }
    } catch (err) {
      onProgress(`Page ${targetPage} failed: ${err.message}`);
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
      await page.waitForSelector('#jobDescriptionText', { timeout: 15000 });
    }, retries);

    if (!ok) return null;

    job.description = await safeText(page, '#jobDescriptionText');
    job.jobType = await safeText(page, '[data-testid="jobTypeLabel"]', job.jobType);
    job.posted = await safeText(page, '[data-testid="job-age"]', job.posted);

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
