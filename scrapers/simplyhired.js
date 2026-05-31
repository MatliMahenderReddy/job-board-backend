// // ======================================================
// // SIMPLYHIRED SCRAPER
// // ======================================================

// const { preparePage, safeText, retry } = require("./utils");

// async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
//   const page = await browser.newPage();
//   await preparePage(page);
//   let allJobs = [];

//   try {
//     const p = targetPage;
//     const params = new URLSearchParams({
//       q: keyword,
//       l: location,
//       pn: p,
//     });

//       if (filters.datePosted) params.set("datePosted", filters.datePosted);
//       if (filters.jobType) params.set("jt", filters.jobType);

//       const url = `https://www.simplyhired.com/search?${params}`;
//       onProgress(`Page ${p}: ${url}`);

//       try {
//         await page.goto(url, { waitUntil: "domcontentloaded", timeout });
//         await page.waitForSelector('[data-testid="searchSerpJob"]', { timeout: 20000 });

//         const jobs = await page.$$eval('[data-testid="searchSerpJob"]', (cards) =>
//           cards.map((card) => {
//             const anchor = card.querySelector('[data-testid="searchSerpJobTitle"] a');
//             let link = anchor?.href || "";
//             if (link.startsWith("/")) link = "https://www.simplyhired.com" + link;

//             return {
//               title: anchor?.innerText?.trim() || "",
//               company: card.querySelector('[data-testid="companyName"]')?.innerText?.trim() || "",
//               location: card.querySelector('[data-testid="searchSerpJobLocation"]')?.innerText?.trim() || "",
//               salary: card.querySelector('[data-testid="searchSerpJobSalaryEst"]')?.innerText?.trim() || "",
//               posted: card.querySelector('[data-testid="searchSerpJobDateStamp"]')?.innerText?.trim() || "",
//               jobType: card.querySelector('[data-testid^="jobTypeChip"]')?.innerText?.trim() || "",
//               link,
//             };
//           })
//         );

//         if (jobs.length) {
//           allJobs.push(...jobs);
//         }
//       } catch (err) {
//         onProgress(`Page ${p} failed: ${err.message}`);
//       }
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
//       await page.waitForSelector('[data-testid="viewJobBodyJobFullDescriptionContent"]', { timeout: 15000 });
//     }, retries);

//     if (!ok) return null;

//     job.description = await safeText(page, '[data-testid="viewJobBodyJobFullDescriptionContent"]');
//     job.jobType = await safeText(page, '[data-testid="viewJobBodyJobDetailsJobType"] [data-testid="detailText"]', job.jobType);
//     job.posted = await safeText(page, '[data-testid="viewJobBodyJobPostingTimestamp"] [data-testid="detailText"]', job.posted);

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




// // ======================================================
// // SIMPLYHIRED SCRAPER 310526:1154
// // ======================================================

// const { preparePage, safeText, retry } = require("./utils");

// async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
//   const page = await browser.newPage();
//   await preparePage(page);
//   let allJobs = [];

//   try {
//     const p = targetPage;
//    const params = new URLSearchParams();

// // Required params
// if (keyword) params.set("q", keyword);
// if (location) params.set("l", location);
// // if (p) params.set("pn", p);

// // Date posted
// if (filters?.datePosted) {
// const datePosted =["12h", "6h", "3h"].includes(filters?.datePosted)
//   ? "1"
//   : filters?.datePosted;
//   params.set("t", datePosted);
// }

// // Sort
// if (filters?.sort === "newest") {
//   params.set("s", "d");
// }

// // Job Type
// if (filters?.jobType) {
//   const jobTypeMap = {
//     fulltime: "CF3CP",
//     parttime: "75GKK",
//     internship: "VDTG7",
//   };

//   if (jobTypeMap[filters.jobType]) {
//     params.set("jt", jobTypeMap[filters.jobType]);
//   }
// }

// // Salary
// if (filters?.salary) {
//   const salaryMap = {
//     "50k": 50000,
//     "100k": 100000,
//     "150k": 150000,
//   };

//   if (salaryMap[filters.salary]) {
//     params.set("mip", salaryMap[filters.salary]);
//   }
// }

// const url = `https://www.simplyhired.com/search?${params.toString()}`;
// console.log("url",url)
//       onProgress(`Page ${p}: ${url}`);

//       try {
//         await page.goto(url, { waitUntil: "domcontentloaded", timeout });
//         await page.waitForSelector('[data-testid="searchSerpJob"]', { timeout: 20000 });

//         const jobs = await page.$$eval('[data-testid="searchSerpJob"]', (cards) =>
//           cards.map((card) => {
//             const anchor = card.querySelector('[data-testid="searchSerpJobTitle"] a');
//             let link = anchor?.href || "";
//             if (link.startsWith("/")) link = "https://www.simplyhired.com" + link;

//             return {
//               title: anchor?.innerText?.trim() || "",
//               company: card.querySelector('[data-testid="companyName"]')?.innerText?.trim() || "",
//               location: card.querySelector('[data-testid="searchSerpJobLocation"]')?.innerText?.trim() || "",
//               salary: card.querySelector('[data-testid="searchSerpJobSalaryEst"]')?.innerText?.trim() || "",
//               posted: card.querySelector('[data-testid="searchSerpJobDateStamp"]')?.innerText?.trim() || "",
//               jobType: card.querySelector('[data-testid^="jobTypeChip"]')?.innerText?.trim() || "",
//               link,
//             };
//           })
//         );

//         if (jobs.length) {
//           allJobs.push(...jobs);
//         }
//       } catch (err) {
//         onProgress(`Page ${p} failed: ${err.message}`);
//       }
//   } finally {
//     await page.close();
//   }

//   return dedup(allJobs);
// }

// async function scrapeDetail({ browser, job, timeout, retries }) {
//   if (!job.link) return null;
// if (!browser.isConnected()) return null; 
//   const page = await browser.newPage();
//   await preparePage(page);

//   try {
//     const ok = await retry(async () => {
//       await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
//       await page.waitForSelector('[data-testid="viewJobBodyJobFullDescriptionContent"]', { timeout: 15000 });
//     }, retries);

//     if (!ok) return null;

//     job.description = await safeText(page, '[data-testid="viewJobBodyJobFullDescriptionContent"]');
//     job.jobType = await safeText(page, '[data-testid="viewJobBodyJobDetailsJobType"] [data-testid="detailText"]', job.jobType);
//     job.posted = await safeText(page, '[data-testid="viewJobBodyJobPostingTimestamp"] [data-testid="detailText"]', job.posted);

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



// ======================================================
// SIMPLYHIRED SCRAPER — Production Multi-Page
// ======================================================

const { safeText, retry } = require("./utils");

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
const sleep  = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

async function prepareSimplyhiredPage(page) {
  await page.setUserAgent(
    USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  );
  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9",
    "accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "cache-control":   "no-cache",
  });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["image", "stylesheet", "font", "media"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
}

async function isBlocked(page) {
  const url      = page.url();
  const bodyText = await page
    .$eval("body", (el) => el.innerText.slice(0, 500))
    .catch(() => "");

  return [
    url.includes("captcha"),
    url.includes("challenge"),
    bodyText.toLowerCase().includes("verify you are human"),
    bodyText.toLowerCase().includes("access denied"),
    bodyText.toLowerCase().includes("unusual traffic"),
  ].some(Boolean);
}

// ─────────────────────────────────────────────────────
// BUILD URL
// SimplyHired pagination: pn=1, pn=2, pn=3 ...
// ─────────────────────────────────────────────────────
function buildUrl(keyword, location, filters, targetPage) {
  const params = new URLSearchParams();

  if (keyword)  params.set("q", keyword);
  if (location) params.set("l", location);

  // Pagination: pn=1 for page 1, pn=2 for page 2, etc.
  if (targetPage > 1) params.set("pn", targetPage);

  if (filters?.datePosted) {
    const datePosted = ["12h", "6h", "3h"].includes(filters.datePosted)
      ? "1"
      : filters.datePosted;
    params.set("t", datePosted);
  }

  if (filters?.sort === "newest") params.set("s", "d");

  if (filters?.jobType) {
    const jobTypeMap = {
      fulltime:   "CF3CP",
      parttime:   "75GKK",
      internship: "VDTG7",
      contract:   "VDTG8",
      temporary:  "VDTG9",
    };
    if (jobTypeMap[filters.jobType]) params.set("jt", jobTypeMap[filters.jobType]);
  }

  if (filters?.salary) {
    const salaryMap = { "50k": 50000, "100k": 100000, "150k": 150000 };
    if (salaryMap[filters.salary]) params.set("mip", salaryMap[filters.salary]);
  }

  return `https://www.simplyhired.com/search?${params.toString()}`;
}

// ─────────────────────────────────────────────────────
// SCRAPE — one page
// ─────────────────────────────────────────────────────
async function scrape({
  browser,
  keyword,
  location,
  filters = {},
  targetPage = 1,
  timeout,
  onProgress,
}) {
  const page = await browser.newPage();
  await prepareSimplyhiredPage(page);
  let allJobs = [];

  try {
    const url = buildUrl(keyword, location, filters, targetPage);
    onProgress(`Page ${targetPage}: ${url}`);

    // ── Warm-up for page 2+ ────────────────────────────────────────────────
    if (targetPage > 1) {
      try {
        const warmUrl = buildUrl(keyword, location, {}, 1);
        onProgress("Warm-up: visiting page 1 first...");
        await page.goto(warmUrl, { waitUntil: "domcontentloaded", timeout });
        await sleep(jitter(1200, 2500));

        if (await isBlocked(page)) {
          onProgress("BLOCKED on warm-up — aborting");
          return [];
        }
      } catch (err) {
        onProgress(`Warm-up failed (non-fatal): ${err.message}`);
      }
    }

    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await sleep(jitter(800, 2000));

    if (await isBlocked(page)) {
      onProgress(`BLOCKED on page ${targetPage}`);
      return [];
    }

    // Check if we're past the last page (SimplyHired redirects to page 1 on OOB)
    const currentUrl = page.url();
    if (targetPage > 1 && !currentUrl.includes(`pn=${targetPage}`)) {
      onProgress(`Page ${targetPage} redirected — likely past last page`);
      return [];
    }

    try {
      await page.waitForSelector('[data-testid="searchSerpJob"]', {
        timeout: 20000,
      });
    } catch {
      onProgress("No job cards found — possible empty page");
      return [];
    }

    // Scroll for lazy-loaded cards
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await sleep(jitter(500, 1200));

    const jobs = await page.$$eval(
      '[data-testid="searchSerpJob"]',
      (cards) =>
        cards.map((card) => {
          const anchor = card.querySelector('[data-testid="searchSerpJobTitle"] a');
          let link = anchor?.href || "";
          if (link.startsWith("/")) link = `https://www.simplyhired.com${link}`;

          return {
            title:    anchor?.innerText?.trim() || "",
            company:  card.querySelector('[data-testid="companyName"]')?.innerText?.trim() || "",
            location: card.querySelector('[data-testid="searchSerpJobLocation"]')?.innerText?.trim() || "",
            salary:   card.querySelector('[data-testid="searchSerpJobSalaryEst"]')?.innerText?.trim() || "",
            posted:   card.querySelector('[data-testid="searchSerpJobDateStamp"]')?.innerText?.trim() || "",
            jobType:  card.querySelector('[data-testid^="jobTypeChip"]')?.innerText?.trim() || "",
            link,
          };
        }).filter((j) => j.title && j.link)
    );

    onProgress(`Page ${targetPage}: ${jobs.length} jobs`);
    allJobs.push(...jobs);

  } catch (err) {
    onProgress(`Page ${targetPage} failed: ${err.message}`);
  } finally {
    await page.close();
  }

  return dedup(allJobs);
}

// ─────────────────────────────────────────────────────
// DETAIL
// ─────────────────────────────────────────────────────
async function scrapeDetail({ browser, job, timeout, retries }) {
  if (!job.link) return null;
  if (!browser.isConnected()) return null;

  const page = await browser.newPage();
  await prepareSimplyhiredPage(page);

  try {
    const ok = await retry(async () => {
      await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
      await page.waitForSelector(
        '[data-testid="viewJobBodyJobFullDescriptionContent"]',
        { timeout: 15000 }
      );
    }, retries);

    if (!ok) return null;
    if (await isBlocked(page)) return null;

    job.description = await safeText(
      page,
      '[data-testid="viewJobBodyJobFullDescriptionContent"]'
    );
    job.jobType = await safeText(
      page,
      '[data-testid="viewJobBodyJobDetailsJobType"] [data-testid="detailText"]',
      job.jobType
    );
    job.posted = await safeText(
      page,
      '[data-testid="viewJobBodyJobPostingTimestamp"] [data-testid="detailText"]',
      job.posted
    );

    return job;
  } catch {
    return null;
  } finally {
    await page.close();
  }
}

// ─────────────────────────────────────────────────────
function dedup(jobs) {
  const map = new Map();
  for (const job of jobs) {
    const key = `${job.title}||${job.company}||${job.link}`;
    if (!map.has(key)) map.set(key, job);
  }
  return [...map.values()];
}

module.exports = { scrape, scrapeDetail };