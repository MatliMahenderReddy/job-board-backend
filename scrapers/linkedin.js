// ======================================================
// LINKEDIN SCRAPER
// ======================================================

const { preparePage, safeText, retry } = require("./utils");

// LinkedIn date filter codes
const DATE_FILTER_MAP = {
  "1": "r86400",    // Past 24h
  "3": "r259200",   // Past 3 days
  "7": "r604800",   // Past week
  "30": "r2592000", // Past month
};

// LinkedIn job type codes
const JOB_TYPE_MAP = {
  fulltime: "F",
  parttime: "P",
  contract: "C",
  temporary: "T",
  internship: "I",
};

async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
  const page = await browser.newPage();
  await preparePage(page);
  let allJobs = [];

  try {
    const p = targetPage - 1;
    const params = new URLSearchParams({
      keywords: keyword,
      location,
      start: p * 25,
      sortBy: "DD", // Most recent
    });

      if (filters.datePosted && DATE_FILTER_MAP[filters.datePosted]) {
        params.set("f_TPR", DATE_FILTER_MAP[filters.datePosted]);
      }

      if (filters.jobType && JOB_TYPE_MAP[filters.jobType.toLowerCase()]) {
        params.set("f_JT", JOB_TYPE_MAP[filters.jobType.toLowerCase()]);
      }

      if (filters.remote) {
        params.set("f_WT", "2"); // Remote
      }

      if (filters.experienceLevel) {
        const expMap = { entry: "2", mid: "3", senior: "4", director: "5" };
        if (expMap[filters.experienceLevel]) params.set("f_E", expMap[filters.experienceLevel]);
      }

      const url = `https://www.linkedin.com/jobs/search?${params}`;
      onProgress(`Page ${targetPage}: ${url}`);

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout });
        await page.waitForSelector('.jobs-search__results-list li', { timeout: 20000 });

        const jobs = await page.$$eval('.jobs-search__results-list li', (cards) =>
          cards.map((card) => {
            const anchor = card.querySelector('a.base-card__full-link') || card.querySelector('a');
            const link = anchor?.href || "";

            return {
              title: card.querySelector('.base-search-card__title')?.innerText?.trim() || "",
              company: card.querySelector('.base-search-card__subtitle a')?.innerText?.trim() || card.querySelector('.base-search-card__subtitle')?.innerText?.trim() || "",
              location: card.querySelector('.job-search-card__location')?.innerText?.trim() || "",
              salary: card.querySelector('.job-search-card__salary-info')?.innerText?.trim() || "",
              posted: card.querySelector('time')?.getAttribute("datetime") || card.querySelector('.job-search-card__listdate')?.innerText?.trim() || "",
              jobType: card.querySelector('.job-search-card__benefits')?.innerText?.trim() || "",
              link: link.split("?")[0], // clean URL
            };
          })
        );

        const valid = jobs.filter((j) => j.title && j.link);
        if (valid.length) {
          allJobs.push(...valid);
        }

        // LinkedIn lazy-loads — scroll down
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await new Promise((r) => setTimeout(r, 1500));
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
      await page.waitForSelector('.description__text', { timeout });
    }, retries);

    if (!ok) return null;

    job.description = await safeText(page, '.description__text');
    job.jobType = await safeText(page, '.description__job-criteria-text', job.jobType);

    // Get all criteria items
    const criteria = await page.$$eval('.description__job-criteria-item', (items) => {
      const map = {};
      items.forEach((item) => {
        const label = item.querySelector('.description__job-criteria-subheader')?.innerText?.trim() || "";
        const value = item.querySelector('.description__job-criteria-text')?.innerText?.trim() || "";
        map[label] = value;
      });
      return map;
    });

    if (criteria["Employment type"]) job.jobType = criteria["Employment type"];
    if (criteria["Seniority level"]) job.seniority = criteria["Seniority level"];
    if (criteria["Industries"]) job.industry = criteria["Industries"];

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
