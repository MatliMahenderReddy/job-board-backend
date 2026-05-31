// // ======================================================
// // GLASSDOOR SCRAPER
// // ======================================================

// const { preparePage, safeText, retry } = require("./utils");

// async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
//   const page = await browser.newPage();
//   await preparePage(page);
//   let allJobs = [];

//   try {
//     const p = targetPage;
//     const encodedKeyword = encodeURIComponent(keyword.replace(/\s+/g, "-"));
//     const encodedLocation = encodeURIComponent(location.replace(/\s+/g, "-"));
//     const url = `https://www.glassdoor.com/Job/${encodedLocation}-${encodedKeyword}-jobs-SRCH_IL.0,${encodedLocation.length}_IN1_KO${encodedLocation.length + 1},${encodedLocation.length + 1 + encodedKeyword.length}.htm?p=${p}&employerSizes=3`;

//     onProgress(`Page ${p}: ${url}`);

//       try {
//         await page.goto(url, { waitUntil: "domcontentloaded", timeout });
//         await page.waitForSelector('[data-test="jobListing"]', { timeout: 20000 });

//         const jobs = await page.$$eval('[data-test="jobListing"]', (cards) =>
//           cards.map((card) => {
//             // const anchor = card.querySelector('a[data-test="job-title"]') || card.querySelector('.job-title a');
//             // const link = anchor ? ("https://www.glassdoor.com" + (anchor.getAttribute("href") || "")) : "";
//                  const anchor =  card.querySelector('a[href*="job-listing"]')||card.querySelector('a[data-test="job-title"]') || card.querySelector('.job-title a');
//             // const link = anchor ? ("https://www.glassdoor.com" + (anchor.getAttribute("href") || "")) : "";
           

// let link = "";
// if (anchor) {
//   const href = anchor.getAttribute("href") || "";
//   link = href.startsWith("http")
//     ? href
//     : `https://www.glassdoor.com${href}`;    // ✅ produces full valid URL
// }
//         const companyEl =
//             card.querySelector('[data-test="employer-short-name"]') ||
//             card.querySelector('span[class*="EmployerProfile"]') ||
//             card.querySelector('heading_Heading__aomVx heading_Subhead__jiUbT"]') ||
//             card.querySelector('[data-test="employer-name"]'); // legacy fallback
//             return {
//               title: anchor?.innerText?.trim() || card.querySelector('.job-title')?.innerText?.trim() || "",
//               company: companyEl?.innerText?.trim() || "",
//               location: card.querySelector('[data-test="emp-location"]')?.innerText?.trim() || "",
//               salary: card.querySelector('[data-test="detailSalary"]')?.innerText?.trim() || "",
//               posted: card.querySelector('[data-test="job-age"]')?.innerText?.trim() || "",
//               jobType: card.querySelector('[data-test="job-type"]')?.innerText?.trim() || "",
//               rating: card.querySelector('[data-test="rating"]')?.innerText?.trim() || "",
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
//       await page.waitForSelector('[data-test="jobDescriptionContent"]', { timeout: 15000 });
//     }, retries);

//     if (!ok) return null;

//     job.description = await safeText(page, '[data-test="jobDescriptionContent"]');

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
// GLASSDOOR SCRAPER 310526:1153
// ======================================================

// const { preparePage, safeText, retry } = require("./utils");

// async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
//   const page = await browser.newPage();
//   await preparePage(page);
//   let allJobs = [];

//   try {
//     const p = targetPage;
//     // const encodedKeyword = encodeURIComponent(keyword.replace(/\s+/g, "-"));
//     // const encodedLocation = encodeURIComponent(location.replace(/\s+/g, "-"));
//     const encodedKeyword  = keyword.trim().toLowerCase().replace(/\s+/g, "-");
// const encodedLocation = location.trim().toLowerCase().replace(/\s+/g, "-");
//     console.log("location",location)
//     console.log("filters",filters)
//    const filter = {};

// if (filters?.datePosted)    filter.fromAge       = ["12h", "6h", "3h"].includes(filters?.datePosted)? "1": filters?.datePosted;;
// if (filters?.employerSizes) filter.employerSizes = filters.employerSizes;
// if (filters?.sort === "newest") filter.sortBy    = "date_desc";
// if (filters?.salary) {
//   filter.maxSalary =
//     filters.salary === "50k"  ? 50000  :
//     filters.salary === "100k" ? 100000 : 150000; // ✅ no comma
// }

// // Build query string from filter object
// const filterParams = new URLSearchParams({ p, ...filter }).toString();
// const locLen = encodedLocation.length;  // "united-states" = 13
// const kwEnd  = locLen + 1 + encodedKeyword.length;
// // const url = `https://www.glassdoor.com/Job/${encodedLocation}-${encodedKeyword}-jobs-SRCH_IL.0,${encodedLocation.length}_IN1_KO${encodedLocation.length + 1},${encodedLocation.length + 1 + encodedKeyword.length}.htm?${filterParams}`;
// const url = `https://www.glassdoor.co.in/Job/${encodedLocation}-${encodedKeyword}-jobs-SRCH_IL.0,${locLen}_IN1_KO${locLen + 1},${kwEnd}.htm?${filterParams}`;
// console.log("url",url)
//     onProgress(`Page ${p}: ${url}`);

//       try {
//         await page.goto(url, { waitUntil: "domcontentloaded", timeout });
//         await page.waitForSelector('[data-test="jobListing"]', { timeout: 20000 });

//         const jobs = await page.$$eval('[data-test="jobListing"]', (cards) =>
//           cards.map((card) => {
//             // const anchor = card.querySelector('a[data-test="job-title"]') || card.querySelector('.job-t
//                  const anchor =  card.querySelector('a[href*="job-listing"]')||card.querySelector('a[data-test="job-title"]') || card.querySelector('.job-title a');
           

// let link = "";
// if (anchor) {
//   const href = anchor.getAttribute("href") || "";
//   link = href.startsWith("http")
//     ? href
//     : `https://www.glassdoor.com${href}`;    // ✅ produces full valid URL
// }
//         const companyEl =
//             card.querySelector('[data-test="employer-short-name"]') ||
//             card.querySelector('span[class*="EmployerProfile"]') ||
//             card.querySelector('heading_Heading__aomVx heading_Subhead__jiUbT"]') ||
//             card.querySelector('[data-test="employer-name"]'); // legacy fallback
//             return {
//               title: anchor?.innerText?.trim() || card.querySelector('.job-title')?.innerText?.trim() || "",
//               company: companyEl?.innerText?.trim() || "",
//               location: card.querySelector('[data-test="emp-location"]')?.innerText?.trim() || "",
//               salary: card.querySelector('[data-test="detailSalary"]')?.innerText?.trim() || "",
//               posted: card.querySelector('[data-test="job-age"]')?.innerText?.trim() || "",
//               jobType: card.querySelector('[data-test="job-type"]')?.innerText?.trim() || "",
//               rating: card.querySelector('[data-test="rating"]')?.innerText?.trim() || "",
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
//       await page.waitForSelector('[data-test="jobDescriptionContent"]', { timeout: 15000 });
//     }, retries);

//     if (!ok) return null;

//     job.description = await safeText(page, '[data-test="jobDescriptionContent"]');

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
// GLASSDOOR SCRAPER — Production Multi-Page
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

async function prepareGlassdoorPage(page) {
  await page.setUserAgent(
    USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  );
  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9",
    "accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
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
  const title    = await page.title().catch(() => "");
  const bodyText = await page
    .$eval("body", (el) => el.innerText.slice(0, 500))
    .catch(() => "");

  return [
    url.includes("challenge"),
    url.includes("captcha"),
    title.toLowerCase().includes("just a moment"),
    bodyText.toLowerCase().includes("enable javascript"),
    bodyText.toLowerCase().includes("verify you are human"),
    bodyText.toLowerCase().includes("access denied"),
    // Glassdoor-specific: login wall
    bodyText.toLowerCase().includes("sign in to see who's hiring"),
  ].some(Boolean);
}

// ─────────────────────────────────────────────────────
// BUILD URL
// Glassdoor pagination uses the `p` query param.
// URL format: /Job/{location}-{keyword}-jobs-SRCH_IL.0,{locLen}_IN1_KO{locLen+1},{kwEnd}.htm?p=N
// ─────────────────────────────────────────────────────
function buildGlassdoorUrl(keyword, location, filters, page) {
  const encLoc = location.trim().toLowerCase().replace(/\s+/g, "-");
  const encKw  = keyword.trim().toLowerCase().replace(/\s+/g, "-");
  const locLen = encLoc.length;
  const kwEnd  = locLen + 1 + encKw.length;

  const filterParams = {};
  if (page > 1) filterParams.p = page;
  if (filters?.datePosted) {
    filterParams.fromAge = ["12h", "6h", "3h"].includes(filters.datePosted)
      ? "1"
      : filters.datePosted;
  }
  if (filters?.sort === "newest") filterParams.sortBy = "date_desc";
  if (filters?.salary) {
    const salMap = { "50k": 50000, "100k": 100000, "150k": 150000 };
    if (salMap[filters.salary]) filterParams.maxSalary = salMap[filters.salary];
  }

  const qs = new URLSearchParams(filterParams).toString();
  const base = `https://www.glassdoor.com/Job/${encLoc}-${encKw}-jobs-SRCH_IL.0,${locLen}_IN1_KO${locLen + 1},${kwEnd}.htm`;

  return qs ? `${base}?${qs}` : base;
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
  await prepareGlassdoorPage(page);
  let allJobs = [];

  try {
    const url = buildGlassdoorUrl(keyword, location, filters, targetPage);
    onProgress(`Page ${targetPage}: ${url}`);

    // ── Warm-up: visit page 1 first for page 2+ ────────────────────────────
    if (targetPage > 1) {
      try {
        const warmUrl = buildGlassdoorUrl(keyword, location, {}, 1);
        onProgress("Warm-up: visiting page 1 first...");
        await page.goto(warmUrl, { waitUntil: "domcontentloaded", timeout });
        await sleep(jitter(1500, 3000));

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

    // Wait for job cards
    try {
      await page.waitForSelector('[data-test="jobListing"]', { timeout: 20000 });
    } catch {
      // Try alternate selectors
      const alt = await page.$('[class*="JobCard"]') ||
                  await page.$('[class*="jobCard"]');
      if (!alt) {
        onProgress("No job cards found — possible empty results or layout change");
        return [];
      }
    }

    // Scroll to load all lazy cards
    await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight / 2));
    await sleep(jitter(500, 1200));

    const jobs = await page.$$eval(
      '[data-test="jobListing"]',
      (cards) =>
        cards.map((card) => {
          const anchor =
            card.querySelector('a[href*="job-listing"]') ||
            card.querySelector('a[data-test="job-title"]') ||
            card.querySelector(".job-title a");

          let link = "";
          if (anchor) {
            const href = anchor.getAttribute("href") || "";
            link = href.startsWith("http")
              ? href
              : `https://www.glassdoor.com${href}`;
          }

          const companyEl =
            card.querySelector('[data-test="employer-short-name"]') ||
            card.querySelector('[data-test="employer-name"]') ||
            card.querySelector('[class*="EmployerProfile"]');

          return {
            title:    anchor?.innerText?.trim() || "",
            company:  companyEl?.innerText?.trim() || "",
            location: card.querySelector('[data-test="emp-location"]')?.innerText?.trim() || "",
            salary:   card.querySelector('[data-test="detailSalary"]')?.innerText?.trim() || "",
            posted:   card.querySelector('[data-test="job-age"]')?.innerText?.trim() || "",
            jobType:  card.querySelector('[data-test="job-type"]')?.innerText?.trim() || "",
            rating:   card.querySelector('[data-test="rating"]')?.innerText?.trim() || "",
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
  await prepareGlassdoorPage(page);

  try {
    const ok = await retry(async () => {
      await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
      await page.waitForSelector('[data-test="jobDescriptionContent"]', {
        timeout: 15000,
      });
    }, retries);

    if (!ok) return null;
    if (await isBlocked(page)) return null;

    job.description = await safeText(page, '[data-test="jobDescriptionContent"]');

    // Try to get salary from detail page if not on listing
    if (!job.salary) {
      job.salary = await safeText(page, '[data-test="salary-estimate"]', "");
    }

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