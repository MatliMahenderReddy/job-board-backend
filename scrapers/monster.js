// ======================================================
// MONSTER SCRAPER
// ======================================================

const { preparePage, safeText, retry } = require("./utils");

async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
  const page = await browser.newPage();
  await preparePage(page);
  let allJobs = [];

  try {
    const p = targetPage;
    const params = new URLSearchParams({
      q: keyword,
      where: location,
      pg: p,
    });

      if (filters.jobType) params.set("jobtype", filters.jobType);
      if (filters.remote) params.set("remoteoptions", "1");

      const url = `https://www.monster.com/jobs/search?${params}`;
      onProgress(`Page ${p}: ${url}`);

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout });
        await page.waitForSelector('[data-testid="svx-job-card"]', { timeout: 20000 });

        const jobs = await page.$$eval('[data-testid="svx-job-card"]', (cards) =>
          cards.map((card) => {
            const anchor = card.querySelector('a[data-testid="job-title"]');
            const link = anchor?.href || "";

            return {
              title: anchor?.innerText?.trim() || "",
              company: card.querySelector('[data-testid="company-name"]')?.innerText?.trim() || "",
              location: card.querySelector('[data-testid="job-location"]')?.innerText?.trim() || "",
              salary: card.querySelector('[data-testid="salary"]')?.innerText?.trim() || "",
              posted: card.querySelector('time')?.getAttribute("datetime") || card.querySelector('[data-testid="job-date"]')?.innerText?.trim() || "",
              jobType: card.querySelector('[data-testid="job-type"]')?.innerText?.trim() || "",
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
      await page.waitForSelector('[data-testid="job-description"]', { timeout: 15000 });
    }, retries);

    if (!ok) return null;

    job.description = await safeText(page, '[data-testid="job-description"]');
    job.jobType = await safeText(page, '[data-testid="job-type"]', job.jobType);

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
