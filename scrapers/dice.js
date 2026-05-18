// ======================================================
// DICE SCRAPER
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
      location,
      page: p,
      pageSize: 20,
    });

      if (filters.jobType) params.set("employmentType", filters.jobType.toUpperCase());
      if (filters.remote) params.set("filters.workplaceTypes", "Remote");
      if (filters.datePosted) params.set("filters.postedDate", `PT${filters.datePosted}H`);

      const url = `https://www.dice.com/jobs?${params}`;
      onProgress(`Page ${p}: ${url}`);

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout });
        await page.waitForSelector('dhi-search-card', { timeout: 20000 });

        const jobs = await page.$$eval('dhi-search-card', (cards) =>
          cards.map((card) => {
            const anchor = card.querySelector('a[data-cy="card-title-link"]');
            const link = anchor?.href || "";

            return {
              title: anchor?.innerText?.trim() || "",
              company: card.querySelector('[data-cy="search-result-company-name"]')?.innerText?.trim() || "",
              location: card.querySelector('[data-cy="search-result-location"]')?.innerText?.trim() || "",
              salary: card.querySelector('[data-cy="compensation"]')?.innerText?.trim() || "",
              posted: card.querySelector('[data-cy="card-posted-date"]')?.innerText?.trim() || "",
              jobType: card.querySelector('[data-cy="employment-type"]')?.innerText?.trim() || "",
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
      await page.waitForSelector('[data-cy="jobDescription"]', { timeout: 15000 });
    }, retries);

    if (!ok) return null;

    job.description = await safeText(page, '[data-cy="jobDescription"]');
    job.jobType = await safeText(page, '[data-cy="employmentType"]', job.jobType);

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
