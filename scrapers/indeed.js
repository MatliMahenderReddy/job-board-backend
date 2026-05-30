// ======================================================
// INDEED SCRAPER
// ======================================================

const { preparePage, safeText, retry } = require("./utils");

// async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
//   const page = await browser.newPage();
//   await preparePage(page);
//   let allJobs = [];

//   try {
//     const p = targetPage - 1;
//     const params = new URLSearchParams({
//       q: keyword,
//       l: location,
//       start: p * 10,
//     });

//     if (filters.datePosted) {
//       const map = { "1": "1", "3": "3", "7": "7", "14": "14", "30": "30" };
//       if (map[filters.datePosted]) params.set("fromage", map[filters.datePosted]);
//     }
//     if (filters.jobType) params.set("jt", filters.jobType);
//     if (filters.remote) params.set("remotejob", "1");

//     const url = `https://www.indeed.com/jobs?${params}`;
//     onProgress(`Page ${targetPage}: ${url}`);

//       try {
//         await page.goto(url, { waitUntil: "domcontentloaded", timeout });
//         await page.waitForSelector('[data-testid="slider_item"]', { timeout: 20000 });

//         const jobs = await page.$$eval('[data-testid="slider_item"]', (cards) =>
//           cards.map((card) => {
//             const anchor = card.querySelector('h2 a');
//             const link = anchor ? "https://www.indeed.com" + (anchor.getAttribute("href") || "") : "";

//             return {
//               title: card.querySelector('h2 span')?.innerText?.trim() || anchor?.innerText?.trim() || "",
//               company: card.querySelector('[data-testid="company-name"]')?.innerText?.trim() || "",
//               location: card.querySelector('[data-testid="text-location"]')?.innerText?.trim() || "",
//               salary: card.querySelector('[data-testid="attribute_snippet_testid"]')?.innerText?.trim() || "",
//               posted: card.querySelector('[data-testid="myJobsStateDate"]')?.innerText?.trim() || "",
//               jobType: "",
//               link,
//             };
//           })
//         );

//       if (jobs.length) {
//         allJobs.push(...jobs);
//       }
//     } catch (err) {
//       onProgress(`Page ${targetPage} failed: ${err.message}`);
//     }
//   } finally {
//     await page.close();
//   }

//   return dedup(allJobs);
// }

// async function scrapeDetail({ browser, job, timeout, retries }) {
//   if (!job.link) return null;

//   const page = await browser.newPage();
//   await preparePage(page);

//   try {
//     const ok = await retry(async () => {
//       await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
//       await page.waitForSelector('#jobDescriptionText', { timeout: 15000 });
//     }, retries);

//     if (!ok) return null;

//     job.description = await safeText(page, '#jobDescriptionText');
//     job.jobType = await safeText(page, '[data-testid="jobTypeLabel"]', job.jobType);
//     job.posted = await safeText(page, '[data-testid="job-age"]', job.posted);

//     return job;
//   } catch {
//     return null;
//   } finally {
//     await page.close();
//   }
// }

// function dedup(jobs) {
//   const map = new Map();
//   for (const job of jobs) {
//     const key = `${job.title}-${job.company}-${job.link}`;
//     if (!map.has(key)) map.set(key, job);
//   }
//   return [...map.values()];
// }

// module.exports = { scrape, scrapeDetail };



async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
  const page = await browser.newPage();
  await preparePage(page);
  let allJobs = [];

  try {
    const params = new URLSearchParams({ q: keyword, l: location });
    if (filters.datePosted) {
      const map = { "3h": "1", "6h": "1", "12h": "1", "1": "1", "3": "3", "7": "7", "14": "14", "30": "30" };
      if (map[filters.datePosted]) params.set("fromage", map[filters.datePosted]);
    }
    if (filters?.sort === "newest") params.set("sort", "date");
    if (targetPage > 1) params.set("start", (targetPage - 1) * 10);

    const url = `https://www.indeed.com/jobs?${params}`;
    onProgress(`Page ${targetPage}: ${url}`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout });

      // ── Step 1: debug what selectors exist ──────────────────────────────
      const debug = await page.evaluate(() => ({
        slider:  document.querySelectorAll('[data-testid="slider_item"]').length,
        beacon:  document.querySelectorAll('.job_seen_beacon').length,
        jk:      document.querySelectorAll('[data-jk]').length,
        list_li: document.querySelectorAll('[data-testid="jobsearch-ResultsList"] li').length,
      }));
      onProgress(`[indeed] DOM — slider:${debug.slider} beacon:${debug.beacon} jk:${debug.jk} list_li:${debug.list_li}`);

      // ── Step 2: pick whichever selector has results ──────────────────────
      const SELECTOR =
        debug.beacon  > 0 ? '.job_seen_beacon' :
        debug.jk      > 0 ? '[data-jk]' :
        debug.list_li > 0 ? '[data-testid="jobsearch-ResultsList"] li[data-jk]' :
        '[data-testid="slider_item"]'; // last resort

      onProgress(`[indeed] Using selector: ${SELECTOR}`);
      await page.waitForSelector(SELECTOR, { timeout: 10000 });

      const jobs = await page.$$eval(SELECTOR, (cards) =>
        cards.map((card) => {

          // ── title ────────────────────────────────────────────────────────
          const titleSpan = card.querySelector('h2 span[title]');
          const title =
            titleSpan?.getAttribute('title')?.trim()   ||
            titleSpan?.innerText?.trim()               ||
            card.querySelector('h2 a span')?.innerText?.trim() ||
            card.querySelector('h2 a')?.innerText?.trim() ||
            card.querySelector('[class*="jobTitle"]')?.innerText?.trim() ||
            "";

          // ── link ─────────────────────────────────────────────────────────
          // data-jk is the most reliable — it's the job key Indeed uses internally
          const jk =
            card.getAttribute('data-jk') ||
            card.querySelector('[data-jk]')?.getAttribute('data-jk') ||
            card.querySelector('h2 a')?.getAttribute('data-jk') ||
            "";

          const href = card.querySelector('h2 a')?.getAttribute('href') || "";

          const link =
            jk   ? `https://www.indeed.com/viewjob?jk=${jk}` :
            href.startsWith('http') ? href :
            href ? `https://www.indeed.com${href}` : "";

          // ── company ──────────────────────────────────────────────────────
          const company =
            card.querySelector('[data-testid="company-name"]')?.innerText?.trim() ||
            card.querySelector('[class*="companyName"]')?.innerText?.trim() ||
            "";

          // ── location ─────────────────────────────────────────────────────
          const location =
            card.querySelector('[data-testid="text-location"]')?.innerText?.trim() ||
            card.querySelector('[class*="companyLocation"]')?.innerText?.trim() ||
            "";

          // ── salary ───────────────────────────────────────────────────────
          const salary =
            card.querySelector('[data-testid="attribute_snippet_testid"]')?.innerText?.trim() ||
            card.querySelector('[class*="salary"]')?.innerText?.trim() ||
            "";

          // ── posted ───────────────────────────────────────────────────────
          const posted =
            card.querySelector('[data-testid="myJobsStateDate"]')?.innerText?.trim() ||
            card.querySelector('.date')?.innerText?.trim() ||
            card.querySelector('[class*="date"]')?.innerText?.trim() ||
            "";

          return { title, company, location, salary, posted, jobType: "", link };
        })
      );

      // ── Step 3: log first result so you can verify immediately ───────────
      onProgress(`[indeed] Got ${jobs.length} jobs. First: "${jobs[0]?.title}" | ${jobs[0]?.link}`);

      if (jobs.length) allJobs.push(...jobs);

    } catch (err) {
      onProgress(`[indeed] Page ${targetPage} failed: ${err.message}`);
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

