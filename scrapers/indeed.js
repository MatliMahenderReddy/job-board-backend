// // ======================================================
// // INDEED SCRAPER 310526:1153
// // ======================================================

// const { preparePage, safeText, retry } = require("./utils");

// // async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
// //   const page = await browser.newPage();
// //   await preparePage(page);
// //   let allJobs = [];

// //   try {
// //     const p = targetPage - 1;
// //     const params = new URLSearchParams({
// //       q: keyword,
// //       l: location,
// //       start: p * 10,
// //     });

// //     if (filters.datePosted) {
// //       const map = { "1": "1", "3": "3", "7": "7", "14": "14", "30": "30" };
// //       if (map[filters.datePosted]) params.set("fromage", map[filters.datePosted]);
// //     }
// //     if (filters.jobType) params.set("jt", filters.jobType);
// //     if (filters.remote) params.set("remotejob", "1");

// //     const url = `https://www.indeed.com/jobs?${params}`;
// //     onProgress(`Page ${targetPage}: ${url}`);

// //       try {
// //         await page.goto(url, { waitUntil: "domcontentloaded", timeout });
// //         await page.waitForSelector('[data-testid="slider_item"]', { timeout: 20000 });

// //         const jobs = await page.$$eval('[data-testid="slider_item"]', (cards) =>
// //           cards.map((card) => {
// //             const anchor = card.querySelector('h2 a');
// //             const link = anchor ? "https://www.indeed.com" + (anchor.getAttribute("href") || "") : "";

// //             return {
// //               title: card.querySelector('h2 span')?.innerText?.trim() || anchor?.innerText?.trim() || "",
// //               company: card.querySelector('[data-testid="company-name"]')?.innerText?.trim() || "",
// //               location: card.querySelector('[data-testid="text-location"]')?.innerText?.trim() || "",
// //               salary: card.querySelector('[data-testid="attribute_snippet_testid"]')?.innerText?.trim() || "",
// //               posted: card.querySelector('[data-testid="myJobsStateDate"]')?.innerText?.trim() || "",
// //               jobType: "",
// //               link,
// //             };
// //           })
// //         );

// //       if (jobs.length) {
// //         allJobs.push(...jobs);
// //       }
// //     } catch (err) {
// //       onProgress(`Page ${targetPage} failed: ${err.message}`);
// //     }
// //   } finally {
// //     await page.close();
// //   }

// //   return dedup(allJobs);
// // }

// // async function scrapeDetail({ browser, job, timeout, retries }) {
// //   if (!job.link) return null;

// //   const page = await browser.newPage();
// //   await preparePage(page);

// //   try {
// //     const ok = await retry(async () => {
// //       await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
// //       await page.waitForSelector('#jobDescriptionText', { timeout: 15000 });
// //     }, retries);

// //     if (!ok) return null;

// //     job.description = await safeText(page, '#jobDescriptionText');
// //     job.jobType = await safeText(page, '[data-testid="jobTypeLabel"]', job.jobType);
// //     job.posted = await safeText(page, '[data-testid="job-age"]', job.posted);

// //     return job;
// //   } catch {
// //     return null;
// //   } finally {
// //     await page.close();
// //   }
// // }

// // function dedup(jobs) {
// //   const map = new Map();
// //   for (const job of jobs) {
// //     const key = `${job.title}-${job.company}-${job.link}`;
// //     if (!map.has(key)) map.set(key, job);
// //   }
// //   return [...map.values()];
// // }

// // module.exports = { scrape, scrapeDetail };



// async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
//   const page = await browser.newPage();
//   await preparePage(page);
//   let allJobs = [];

//   try {
//     const params = new URLSearchParams({ q: keyword, l: location });
//     if (filters.datePosted) {
//       const map = { "3h": "1", "6h": "1", "12h": "1", "1": "1", "3": "3", "7": "7", "14": "14", "30": "30" };
//       if (map[filters.datePosted]) params.set("fromage", map[filters.datePosted]);
//     }
//     if (filters?.sort === "newest") params.set("sort", "date");
//     if (targetPage > 1) params.set("start", (targetPage - 1) * 10);

//     const url = `https://www.indeed.com/jobs?${params}`;
//     onProgress(`Page ${targetPage}: ${url}`);

//     try {
//       await page.goto(url, { waitUntil: "domcontentloaded", timeout });

//       // ── Step 1: debug what selectors exist ──────────────────────────────
//       const debug = await page.evaluate(() => ({
//         slider:  document.querySelectorAll('[data-testid="slider_item"]').length,
//         beacon:  document.querySelectorAll('.job_seen_beacon').length,
//         jk:      document.querySelectorAll('[data-jk]').length,
//         list_li: document.querySelectorAll('[data-testid="jobsearch-ResultsList"] li').length,
//       }));
//       onProgress(`[indeed] DOM — slider:${debug.slider} beacon:${debug.beacon} jk:${debug.jk} list_li:${debug.list_li}`);

//       // ── Step 2: pick whichever selector has results ──────────────────────
//       const SELECTOR =
//         debug.beacon  > 0 ? '.job_seen_beacon' :
//         debug.jk      > 0 ? '[data-jk]' :
//         debug.list_li > 0 ? '[data-testid="jobsearch-ResultsList"] li[data-jk]' :
//         '[data-testid="slider_item"]'; // last resort

//       onProgress(`[indeed] Using selector: ${SELECTOR}`);
//       await page.waitForSelector(SELECTOR, { timeout: 10000 });

//       const jobs = await page.$$eval(SELECTOR, (cards) =>
//         cards.map((card) => {

//           // ── title ────────────────────────────────────────────────────────
//           const titleSpan = card.querySelector('h2 span[title]');
//           const title =
//             titleSpan?.getAttribute('title')?.trim()   ||
//             titleSpan?.innerText?.trim()               ||
//             card.querySelector('h2 a span')?.innerText?.trim() ||
//             card.querySelector('h2 a')?.innerText?.trim() ||
//             card.querySelector('[class*="jobTitle"]')?.innerText?.trim() ||
//             "";

//           // ── link ─────────────────────────────────────────────────────────
//           // data-jk is the most reliable — it's the job key Indeed uses internally
//           const jk =
//             card.getAttribute('data-jk') ||
//             card.querySelector('[data-jk]')?.getAttribute('data-jk') ||
//             card.querySelector('h2 a')?.getAttribute('data-jk') ||
//             "";

//           const href = card.querySelector('h2 a')?.getAttribute('href') || "";

//           const link =
//             jk   ? `https://www.indeed.com/viewjob?jk=${jk}` :
//             href.startsWith('http') ? href :
//             href ? `https://www.indeed.com${href}` : "";

//           // ── company ──────────────────────────────────────────────────────
//           const company =
//             card.querySelector('[data-testid="company-name"]')?.innerText?.trim() ||
//             card.querySelector('[class*="companyName"]')?.innerText?.trim() ||
//             "";

//           // ── location ─────────────────────────────────────────────────────
//           const location =
//             card.querySelector('[data-testid="text-location"]')?.innerText?.trim() ||
//             card.querySelector('[class*="companyLocation"]')?.innerText?.trim() ||
//             "";

//           // ── salary ───────────────────────────────────────────────────────
//           const salary =
//             card.querySelector('[data-testid="attribute_snippet_testid"]')?.innerText?.trim() ||
//             card.querySelector('[class*="salary"]')?.innerText?.trim() ||
//             "";

//           // ── posted ───────────────────────────────────────────────────────
//           const posted =
//             card.querySelector('[data-testid="myJobsStateDate"]')?.innerText?.trim() ||
//             card.querySelector('.date')?.innerText?.trim() ||
//             card.querySelector('[class*="date"]')?.innerText?.trim() ||
//             "";

//           return { title, company, location, salary, posted, jobType: "", link };
//         })
//       );

//       // ── Step 3: log first result so you can verify immediately ───────────
//       onProgress(`[indeed] Got ${jobs.length} jobs. First: "${jobs[0]?.title}" | ${jobs[0]?.link}`);

//       if (jobs.length) allJobs.push(...jobs);

//     } catch (err) {
//       onProgress(`[indeed] Page ${targetPage} failed: ${err.message}`);
//     }
//   } finally {
//     await page.close();
//   }

//   return dedup(allJobs);
// }

// async function scrapeDetail({ browser, job, timeout, retries }) {
//   if (!job.link) return null;
//  if (!browser.isConnected()) return null; 
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





// ======================================================
// INDEED SCRAPER — Production Multi-Page
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

async function prepareIndeedPage(page) {
  await page.setUserAgent(
    USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  );
  await page.setExtraHTTPHeaders({
    "accept-language":         "en-US,en;q=0.9",
    "accept":                  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "cache-control":           "no-cache",
    "pragma":                  "no-cache",
    "upgrade-insecure-requests": "1",
  });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["image", "stylesheet", "font", "media", "other"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
}

// ─────────────────────────────────────────────────────
// BLOCK DETECTOR
// ─────────────────────────────────────────────────────
async function isBlocked(page) {
  const url       = page.url();
  const title     = await page.title().catch(() => "");
  const bodyText  = await page
    .$eval("body", (el) => el.innerText.slice(0, 600))
    .catch(() => "");

  return [
    url.includes("challenge"),
    url.includes("captcha"),
    url.includes("validatecaptcha"),
    title.toLowerCase().includes("just a moment"),
    title.toLowerCase().includes("attention required"),
    bodyText.toLowerCase().includes("enable javascript"),
    bodyText.toLowerCase().includes("verify you are human"),
    bodyText.toLowerCase().includes("unusual traffic"),
    bodyText.toLowerCase().includes("security check"),
  ].some(Boolean);
}

// ─────────────────────────────────────────────────────
// EXTRACT JOBS — handles all known Indeed layouts
// ─────────────────────────────────────────────────────
async function extractJobs(page, onProgress) {
  const debug = await page.evaluate(() => ({
    beacon:  document.querySelectorAll(".job_seen_beacon").length,
    jk:      document.querySelectorAll("[data-jk]").length,
    mosaic:  document.querySelectorAll('[id^="mosaic-provider-jobcards"] li').length,
    slider:  document.querySelectorAll('[data-testid="slider_item"]').length,
  }));

  onProgress(
    `DOM — beacon:${debug.beacon} jk:${debug.jk} mosaic:${debug.mosaic} slider:${debug.slider}`
  );

  const SELECTOR =
    debug.beacon > 0 ? ".job_seen_beacon" :
    debug.mosaic > 0 ? '[id^="mosaic-provider-jobcards"] li[data-jk]' :
    debug.jk     > 0 ? "[data-jk]" :
    '[data-testid="slider_item"]';

  onProgress(`Using selector: ${SELECTOR}`);

  try {
    await page.waitForSelector(SELECTOR, { timeout: 10000 });
  } catch {
    onProgress("waitForSelector timed out — empty or blocked");
    return [];
  }

  const jobs = await page.$$eval(SELECTOR, (cards) =>
    cards.map((card) => {
      const titleSpan = card.querySelector("h2 span[title]");
      const title =
        titleSpan?.getAttribute("title")?.trim()             ||
        titleSpan?.innerText?.trim()                         ||
        card.querySelector("h2 a span")?.innerText?.trim()   ||
        card.querySelector("h2 a")?.innerText?.trim()        ||
        card.querySelector('[class*="jobTitle"]')?.innerText?.trim() ||
        "";

      const jk =
        card.getAttribute("data-jk") ||
        card.querySelector("[data-jk]")?.getAttribute("data-jk") ||
        card.querySelector("h2 a")?.getAttribute("data-jk") ||
        "";

      const href = card.querySelector("h2 a")?.getAttribute("href") || "";
      const link =
        jk              ? `https://www.indeed.com/viewjob?jk=${jk}` :
        href.startsWith("http") ? href :
        href            ? `https://www.indeed.com${href}` : "";

      const company =
        card.querySelector('[data-testid="company-name"]')?.innerText?.trim()  ||
        card.querySelector('[class*="companyName"]')?.innerText?.trim()        ||
        "";

      const location =
        card.querySelector('[data-testid="text-location"]')?.innerText?.trim()   ||
        card.querySelector('[class*="companyLocation"]')?.innerText?.trim()      ||
        "";

      const salary =
        card.querySelector('[data-testid="attribute_snippet_testid"]')?.innerText?.trim() ||
        card.querySelector('[class*="salary"]')?.innerText?.trim()                        ||
        "";

      const posted =
        card.querySelector('[data-testid="myJobsStateDate"]')?.innerText?.trim() ||
        card.querySelector(".date")?.innerText?.trim()                           ||
        card.querySelector('[class*="date"]')?.innerText?.trim()                 ||
        "";

      const jobType =
        card.querySelector('[class*="attribute_snippet"]')?.innerText?.trim() || "";

      return { title, company, location, salary, posted, jobType, link };
    }).filter((j) => j.title && j.link)
  );

  return jobs;
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
  await prepareIndeedPage(page);
  let allJobs = [];

  try {
    const params = new URLSearchParams({ q: keyword, l: location });

    // Date filter
    if (filters?.datePosted) {
      const dateMap = {
        "3h": "1", "6h": "1", "12h": "1",
        "1": "1", "3": "3", "7": "7", "14": "14", "30": "30",
      };
      if (dateMap[filters.datePosted]) params.set("fromage", dateMap[filters.datePosted]);
    }

    // Sort
    if (filters?.sort === "newest") params.set("sort", "date");

    // Remote
    if (filters?.remote) {
      params.set("remotejob", "032b3046-06a3-4876-8dfd-474eb5e7ed11");
    }

    // Job type
    if (filters?.jobType) {
      const jtMap = {
        fulltime: "fulltime", parttime: "parttime",
        contract: "contract", internship: "internship", temporary: "temporary",
      };
      if (jtMap[filters.jobType]) params.set("jt", jtMap[filters.jobType]);
    }

    // Pagination: page 1 = start omitted, page 2 = start=10, etc.
    const start = (targetPage - 1) * 10;
    if (start > 0) params.set("start", start);

    const url = `https://www.indeed.com/jobs?${params.toString()}`;
    onProgress(`Page ${targetPage} (start=${start}): ${url}`);

    // ── Warm-up: visit page 1 first for page 2+ (reduces bot detection) ───
    if (targetPage > 1) {
      try {
        const warmParams = new URLSearchParams({ q: keyword, l: location });
        onProgress("Warm-up: visiting page 1 first...");
        await page.goto(`https://www.indeed.com/jobs?${warmParams}`, {
          waitUntil: "domcontentloaded",
          timeout,
        });
        await sleep(jitter(1500, 3000));

        if (await isBlocked(page)) {
          onProgress("BLOCKED on warm-up — aborting");
          return [];
        }
      } catch (err) {
        onProgress(`Warm-up failed (non-fatal): ${err.message}`);
      }
    }

    // ── Navigate to target page ────────────────────────────────────────────
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await sleep(jitter(800, 2000));

    if (await isBlocked(page)) {
      onProgress(`BLOCKED on page ${targetPage}`);
      return [];
    }

    // Scroll to trigger lazy cards
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await sleep(jitter(500, 1200));

    const jobs = await extractJobs(page, onProgress);
    onProgress(`Page ${targetPage}: ${jobs.length} jobs — first: "${jobs[0]?.title}"`);
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
  await prepareIndeedPage(page);

  try {
    const ok = await retry(async () => {
      await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
      await page.waitForSelector("#jobDescriptionText", { timeout: 15000 });
    }, retries);

    if (!ok) return null;
    if (await isBlocked(page)) return null;

    job.description = await safeText(page, "#jobDescriptionText");
    job.jobType     = await safeText(page, '[data-testid="jobTypeLabel"]', job.jobType);
    job.posted      = await safeText(page, '[data-testid="job-age"]', job.posted);
    job.salary      = await safeText(
      page,
      '[data-testid="jobsearch-SerpJobCard-salary"]',
      job.salary
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