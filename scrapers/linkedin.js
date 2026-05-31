// // ======================================================
// // LINKEDIN SCRAPER working code
// // ======================================================

// const { preparePage, safeText, retry } = require("./utils");

// // LinkedIn date filter codes
// const DATE_FILTER_MAP = {
//   "1": "r86400",    // Past 24h
//   "3": "r259200",   // Past 3 days
//   "7": "r604800",   // Past week
//   "30": "r2592000", // Past month
// };

// // LinkedIn job type codes
// const JOB_TYPE_MAP = {
//   fulltime: "F",
//   parttime: "P",
//   contract: "C",
//   temporary: "T",
//   internship: "I",
// };

// async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
//   const page = await browser.newPage();
//   await preparePage(page);
//   let allJobs = [];

//   try {
//     const p = targetPage - 1;
//     const params = new URLSearchParams({
//       keywords: keyword,
//       location,
//       start: p * 25,
//       sortBy: "DD", // Most recent
//     });

//       if (filters.datePosted && DATE_FILTER_MAP[filters.datePosted]) {
//         params.set("f_TPR", DATE_FILTER_MAP[filters.datePosted]);
//       }

//       if (filters.jobType && JOB_TYPE_MAP[filters.jobType.toLowerCase()]) {
//         params.set("f_JT", JOB_TYPE_MAP[filters.jobType.toLowerCase()]);
//       }

//       if (filters.remote) {
//         params.set("f_WT", "2"); // Remote
//       }

//       if (filters.experienceLevel) {
//         const expMap = { entry: "2", mid: "3", senior: "4", director: "5" };
//         if (expMap[filters.experienceLevel]) params.set("f_E", expMap[filters.experienceLevel]);
//       }
//     params.set(
//       "f_CS",
//       "1,2,3,4,5"
//     );

//       const url = `https://www.linkedin.com/jobs/search?${params}`;
//       onProgress(`Page ${targetPage}: ${url}`);

//       try {
//         await page.goto(url, { waitUntil: "domcontentloaded", timeout });
//         await page.waitForSelector('.jobs-search__results-list li', { timeout: 20000 });

//         const jobs = await page.$$eval('.jobs-search__results-list li', (cards) =>
//           cards.map((card) => {
//             const anchor = card.querySelector('a.base-card__full-link') || card.querySelector('a');
//             const link = anchor?.href || "";

//             return {
//               title: card.querySelector('.base-search-card__title')?.innerText?.trim() || "",
//               company: card.querySelector('.base-search-card__subtitle a')?.innerText?.trim() || card.querySelector('.base-search-card__subtitle')?.innerText?.trim() || "",
//               location: card.querySelector('.job-search-card__location')?.innerText?.trim() || "",
//               salary: card.querySelector('.job-search-card__salary-info')?.innerText?.trim() || "",
//               posted: card.querySelector('time')?.getAttribute("datetime") || card.querySelector('.job-search-card__listdate')?.innerText?.trim() || "",
//               jobType: card.querySelector('.job-search-card__benefits')?.innerText?.trim() || "",
//               link: link.split("?")[0], // clean URL
//             };
//           })
//         );

//         const valid = jobs.filter((j) => j.title && j.link);
//         if (valid.length) {
//           allJobs.push(...valid);
//         }

//         // LinkedIn lazy-loads — scroll down
//         await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
//         await new Promise((r) => setTimeout(r, 1500));
//       } catch (err) {
//         onProgress(`Page ${targetPage} failed: ${err.message}`);
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
//       await page.waitForSelector('.description__text', { timeout });
//     }, retries);

//     if (!ok) return null;

//     job.description = await safeText(page, '.description__text');
//     job.jobType = await safeText(page, '.description__job-criteria-text', job.jobType);

//     // Get all criteria items
//     const criteria = await page.$$eval('.description__job-criteria-item', (items) => {
//       const map = {};
//       items.forEach((item) => {
//         const label = item.querySelector('.description__job-criteria-subheader')?.innerText?.trim() || "";
//         const value = item.querySelector('.description__job-criteria-text')?.innerText?.trim() || "";
//         map[label] = value;
//       });
//       return map;
//     });

//     if (criteria["Employment type"]) job.jobType = criteria["Employment type"];
//     if (criteria["Seniority level"]) job.seniority = criteria["Seniority level"];
//     if (criteria["Industries"]) job.industry = criteria["Industries"];

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
// // LINKEDIN SCRAPER
// // FILTER COMPANIES BELOW 1200 EMPLOYEES
// // PRODUCTION LEVEL
// // ======================================================
// const pLimit = require("p-limit");

// const DATE_FILTER_MAP = {
//   "1": "r86400",
//   "3": "r259200",
//   "7": "r604800",
//   "30": "r2592000",
// };

// const JOB_TYPE_MAP = {
//   fulltime: "F",
//   parttime: "P",
//   contract: "C",
//   temporary: "T",
//   internship: "I",
// };

// const MAX_CONCURRENCY = 3;

// // ======================================================
// // MAIN SCRAPER
// // ======================================================

// async function scrape({
//   browser,
//   keyword,
//   location,
//   filters = {},
//   targetPage = 1,
//   timeout = 60000,
//   retries = 3,
//   onProgress = console.log,
// }) {
//   const page = await browser.newPage();

//   await preparePage(page);

//   let allJobs = [];

//   try {
//     // ==================================================
//     // LINKEDIN SEARCH PARAMS
//     // ==================================================

//     const params = new URLSearchParams({
//       keywords: keyword,
//       location,
//       start: (targetPage - 1) * 25,
//       sortBy: "DD",
//     });

//     // ==================================================
//     // DATE FILTER
//     // ==================================================

//     if (
//       filters.datePosted &&
//       DATE_FILTER_MAP[filters.datePosted]
//     ) {
//       params.set(
//         "f_TPR",
//         DATE_FILTER_MAP[filters.datePosted]
//       );
//     }

//     // ==================================================
//     // JOB TYPE
//     // ==================================================

//     if (
//       filters.jobType &&
//       JOB_TYPE_MAP[
//         filters.jobType.toLowerCase()
//       ]
//     ) {
//       params.set(
//         "f_JT",
//         JOB_TYPE_MAP[
//           filters.jobType.toLowerCase()
//         ]
//       );
//     }

//     // ==================================================
//     // REMOTE
//     // ==================================================

//     if (filters.remote) {
//       params.set("f_WT", "2");
//     }

//     // ==================================================
//     // EXPERIENCE LEVEL
//     // ==================================================

//     if (filters.experienceLevel) {
//       const expMap = {
//         internship: "1",
//         entry: "2",
//         associate: "3",
//         mid: "4",
//         director: "5",
//         executive: "6",
//       };

//       if (
//         expMap[
//           filters.experienceLevel
//         ]
//       ) {
//         params.set(
//           "f_E",
//           expMap[
//             filters.experienceLevel
//           ]
//         );
//       }
//     }

//     // ==================================================
//     // COMPANY SIZE FILTER
//     // ==================================================

//     params.set(
//       "f_CS",
//       "1,2,3,4,5"
//     );

//     const url =
//       `https://www.linkedin.com/jobs/search?${params}`;

//     onProgress(`Opening: ${url}`);

//     // ==================================================
//     // OPEN PAGE
//     // ==================================================

//     await page.goto(url, {
//       waitUntil: "networkidle2",
//       timeout,
//     });

//     await delay(
//       3000 + Math.random() * 3000
//     );

//     // ==================================================
//     // HUMAN-LIKE MOUSE MOVEMENT
//     // ==================================================

//     await page.mouse.move(100, 100);
//     await page.mouse.move(300, 300);
//     await page.mouse.move(500, 500);

//     // ==================================================
//     // AUTH WALL DETECTION
//     // ==================================================

//     if (
//       page.url().includes("authwall")
//     ) {
//       throw new Error(
//         "LinkedIn blocked request"
//       );
//     }

//     const html =
//       await page.content();

//     if (
//       html.includes("Sign in") ||
//       html.includes("Join now")
//     ) {
//       throw new Error(
//         "LinkedIn login wall detected"
//       );
//     }

//     // ==================================================
//     // WAIT JOBS
//     // ==================================================

//     await page.waitForSelector(
//       `
//       .jobs-search__results-list li,
//       .jobs-search-results-list li,
//       .base-card
//       `,
//       {
//         timeout: 45000,
//       }
//     );

//     // ==================================================
//     // SCROLL
//     // ==================================================

//     for (let i = 0; i < 10; i++) {
//       await page.evaluate(() => {
//         window.scrollBy(
//           0,
//           window.innerHeight * 2
//         );
//       });

//       await delay(
//         1000 + Math.random() * 2000
//       );
//     }

//     // ==================================================
//     // EXTRACT JOBS
//     // ==================================================

//     const jobs = await page.$$eval(
//       `
//       .jobs-search__results-list li,
//       .jobs-search-results-list li,
//       .base-card
//       `,
//       (cards) => {
//         return cards.map((card) => {
//           const anchor =
//             card.querySelector(
//               "a.base-card__full-link"
//             ) ||
//             card.querySelector("a");

//           let link =
//             anchor?.href || "";

//           if (link.includes("?")) {
//             link = link.split("?")[0];
//           }

//           return {
//             title:
//               card
//                 .querySelector(
//                   ".base-search-card__title"
//                 )
//                 ?.innerText?.trim() || "",

//             company:
//               card
//                 .querySelector(
//                   ".base-search-card__subtitle"
//                 )
//                 ?.innerText?.trim() || "",

//             location:
//               card
//                 .querySelector(
//                   ".job-search-card__location"
//                 )
//                 ?.innerText?.trim() || "",

//             salary:
//               card
//                 .querySelector(
//                   ".job-search-card__salary-info"
//                 )
//                 ?.innerText?.trim() || "",

//             posted:
//               card
//                 .querySelector("time")
//                 ?.getAttribute(
//                   "datetime"
//                 ) || "",

//             jobType:
//               card
//                 .querySelector(
//                   ".job-search-card__benefits"
//                 )
//                 ?.innerText?.trim() || "",

//             link,

//             board: "linkedin",
//           };
//         });
//       }
//     );

//     const validJobs = jobs.filter(
//       (job) =>
//         job.title &&
//         job.company &&
//         job.link
//     );

//     onProgress(
//       `Jobs Found: ${validJobs.length}`
//     );

//     allJobs.push(...validJobs);

//     // ==================================================
//     // REMOVE DUPLICATES
//     // ==================================================

//     allJobs = dedup(allJobs);

//     // ==================================================
//     // DETAIL SCRAPING
//     // ==================================================

//     const limit = pLimit(
//       MAX_CONCURRENCY
//     );

//     const detailedJobs =
//       await Promise.all(
//         allJobs.map((job) =>
//           limit(() =>
//             scrapeDetail({
//               browser,
//               job,
//               timeout,
//               retries,
//               filters,
//             })
//           )
//         )
//       );

//     return detailedJobs.filter(Boolean);
//   } catch (err) {
//     console.log(
//       "SCRAPE ERROR:",
//       err.message
//     );

//     try {
//       await page.screenshot({
//         path: `linkedin-error-${Date.now()}.png`,
//         fullPage: true,
//       });
//     } catch {}

//     return [];
//   } finally {
//     await page.close();
//   }
// }

// // ======================================================
// // DETAIL SCRAPER
// // ======================================================

// async function scrapeDetail({
//   browser,
//   job,
//   timeout,
//   retries,
//   filters = {},
// }) {
//   const page = await browser.newPage();

//   await preparePage(page);

//   try {
//     const ok = await retry(
//       async () => {
//         await page.goto(job.link, {
//           waitUntil:
//             "networkidle2",
//           timeout,
//         });

//         await delay(
//           2000 +
//             Math.random() * 2000
//         );

//         if (
//           page.url().includes(
//             "authwall"
//           )
//         ) {
//           throw new Error(
//             "LinkedIn blocked request"
//           );
//         }

//         await page.waitForSelector(
//           ".description__text",
//           {
//             timeout: 20000,
//           }
//         );
//       },
//       retries
//     );

//     if (!ok) {
//       return null;
//     }

//     // ==================================================
//     // DESCRIPTION
//     // ==================================================

//     job.description =
//       await safeText(
//         page,
//         ".description__text"
//       );

//     // ==================================================
//     // JOB CRITERIA
//     // ==================================================

//     const criteria =
//       await page.$$eval(
//         ".description__job-criteria-item",
//         (items) => {
//           const map = {};

//           items.forEach((item) => {
//             const label =
//               item
//                 .querySelector(
//                   ".description__job-criteria-subheader"
//                 )
//                 ?.innerText?.trim()
//                 ?.toLowerCase() ||
//               "";

//             const value =
//               item
//                 .querySelector(
//                   ".description__job-criteria-text"
//                 )
//                 ?.innerText?.trim() ||
//               "";

//             map[label] = value;
//           });

//           return map;
//         }
//       );

//     if (
//       criteria["employment type"]
//     ) {
//       job.jobType =
//         criteria[
//           "employment type"
//         ];
//     }

//     if (
//       criteria["seniority level"]
//     ) {
//       job.seniority =
//         criteria[
//           "seniority level"
//         ];
//     }

//     if (criteria["industries"]) {
//       job.industry =
//         criteria["industries"];
//     }

//     // ==================================================
//     // COMPANY URL
//     // ==================================================

//     const companyUrl =
//       await page.evaluate(() => {
//         const selectors = [
//           'a[data-tracking-control-name="public_jobs_topcard_org-name"]',
//           ".topcard__org-name-link",
//           'a[href*="/company/"]',
//         ];

//         for (const sel of selectors) {
//           const el =
//             document.querySelector(
//               sel
//             );

//           if (
//             el?.href?.includes(
//               "/company/"
//             )
//           ) {
//             return el.href;
//           }
//         }

//         return null;
//       });

//     // ==================================================
//     // COMPANY SIZE
//     // ==================================================

//     let employeeCount = null;

//     if (companyUrl) {
//       job.companyUrl =
//         companyUrl.split("?")[0];

//       employeeCount =
//         await scrapeCompanySize(
//           browser,
//           job.companyUrl,
//           timeout
//         );
//     }

//     job.employeeCount =
//       employeeCount;

//     // ==================================================
//     // STRICT FILTER
//     // ==================================================

//     const MAX_EMPLOYEES =
//       filters.maxEmployees ||
//       1200;

//     if (
//       employeeCount === null
//     ) {
//       console.log(
//         `[${job.company}] skipped unknown size`
//       );

//       return job;
//     }

//     if (
//       employeeCount >
//       MAX_EMPLOYEES
//     ) {
//       console.log(
//         `[${job.company}] skipped large company`
//       );

//       return null;
//     }

//     console.log(
//       `[${job.company}] accepted (${employeeCount})`
//     );

//     return job;
//   } catch (err) {
//     console.log(
//       `DETAIL ERROR: ${err.message}`
//     );

//     return null;
//   } finally {
//     await page.close();
//   }
// }

// // ======================================================
// // COMPANY SIZE SCRAPER
// // ======================================================

// async function scrapeCompanySize(
//   browser,
//   companyUrl,
//   timeout = 20000
// ) {
//   const page = await browser.newPage();

//   await preparePage(page);

//   try {
//     await page.goto(companyUrl, {
//       waitUntil: "networkidle2",
//       timeout,
//     });

//     await delay(3000);

//     const sizeText =
//       await page.evaluate(() => {
//         const bodyText =
//           document.body.innerText;

//         const match =
//           bodyText.match(
//             /([\d,]+)\s*[-–]\s*([\d,]+)\s*employees/i
//           );

//         if (match) {
//           return match[0];
//         }

//         return null;
//       });

//     return parseEmployeeCount(
//       sizeText
//     );
//   } catch {
//     return null;
//   } finally {
//     await page.close();
//   }
// }

// // ======================================================
// // EMPLOYEE PARSER
// // ======================================================

// function parseEmployeeCount(
//   text
// ) {
//   if (!text) return null;

//   text = text
//     .toLowerCase()
//     .replace(/,/g, "");

//   const rangeMatch =
//     text.match(
//       /(\d+)\s*[-–]\s*(\d+)/
//     );

//   if (rangeMatch) {
//     return Number(
//       rangeMatch[1]
//     );
//   }

//   const plusMatch =
//     text.match(/(\d+)\+/);

//   if (plusMatch) {
//     return Number(
//       plusMatch[1]
//     );
//   }

//   const singleMatch =
//     text.match(/(\d+)/);

//   if (singleMatch) {
//     return Number(
//       singleMatch[1]
//     );
//   }

//   return null;
// }

// // ======================================================
// // DEDUP
// // ======================================================

// function dedup(jobs) {
//   const map = new Map();

//   for (const job of jobs) {
//     const key =
//       `${job.title}-${job.company}-${job.link}`;

//     if (!map.has(key)) {
//       map.set(key, job);
//     }
//   }

//   return [...map.values()];
// }

// // ======================================================
// // RETRY
// // ======================================================

// async function retry(
//   fn,
//   retries = 3
// ) {
//   for (
//     let i = 1;
//     i <= retries;
//     i++
//   ) {
//     try {
//       await fn();

//       return true;
//     } catch (err) {
//       if (i === retries) {
//         return false;
//       }

//       await delay(
//         2000 +
//           Math.random() * 2000
//       );
//     }
//   }

//   return false;
// }

// // ======================================================
// // SAFE TEXT
// // ======================================================

// async function safeText(
//   page,
//   selector
// ) {
//   try {
//     return await page.$eval(
//       selector,
//       (el) =>
//         el.innerText.trim()
//     );
//   } catch {
//     return "";
//   }
// }

// // ======================================================
// // PREPARE PAGE
// // ======================================================

// async function preparePage(
//   page
// ) {
//   await page.setViewport({
//     width: 1366,
//     height: 768,
//   });

//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
//   );

//   await page.setExtraHTTPHeaders({
//     "accept-language":
//       "en-US,en;q=0.9",
//   });

//   await page.setRequestInterception(
//     true
//   );

//   page.on(
//     "request",
//     (request) => {
//       const type =
//         request.resourceType();

//       if (
//         [
//           "image",
//           "font",
//           "media",
//         ].includes(type)
//       ) {
//         request.abort();
//       } else {
//         request.continue();
//       }
//     }
//   );
// }

// // ======================================================
// // DELAY
// // ======================================================

// function delay(ms) {
//   return new Promise((r) =>
//     setTimeout(r, ms)
//   );
// }

// // ======================================================
// // EXPORTS
// // ======================================================

// module.exports = {
//   scrape,
//   scrapeDetail,
// };



// ======================================================
// LINKEDIN SCRAPER
// ======================================================

const { preparePage, safeText, retry } = require("./utils");

// LinkedIn date filter codes
const DATE_FILTER_MAP = {
  "3h": "r10800",    // Past 3h
  "6h": "r21600",    // Past 6h
  "12h": "r43200",    // Past 12h
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
    // params.set(
    //   "f_CS",
    //   "1,2,3,4,5"
    // );

      const url = `https://www.linkedin.com/jobs/search?${params}`;
      console.log("url",url)
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
               peoples:"",
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

// async function scrapeDetail({ browser, job, timeout, retries }) {
//   if (!job.link) return null;

//   const page = await browser.newPage();
//   await preparePage(page);

//   try {
//     const ok = await retry(async () => {
//       await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
//       await page.waitForSelector('.description__text', { timeout });
//     }, retries);

//     if (!ok) return null;

//     job.description = await safeText(page, '.description__text');
//     job.jobType = await safeText(page, '.description__job-criteria-text', job.jobType);
// job.applicants = await page.$eval('body', (body) => {
//   const all = [...body.querySelectorAll('span, li, div')];
//   const match = all
//     .map(el => el.textContent?.trim())
//     .find(text =>
//       text.length < 100 &&  // ✅ ignore large containers
//       (
//         /(\d+|over \d+)\s+applicants?/i.test(text) ||
//         /be among the first\s+\d+\s+applicants?/i.test(text) ||
//         /be an early applicant/i.test(text)
//       )
//     );
//   return match || "";
// }).catch(() => "");
//     // Get all criteria items
//     const criteria = await page.$$eval('.description__job-criteria-item', (items) => {
//       const map = {};
//       items.forEach((item) => {
//         const label = item.querySelector('.description__job-criteria-subheader')?.innerText?.trim() || "";
//         const value = item.querySelector('.description__job-criteria-text')?.innerText?.trim() || "";
//         map[label] = value;
//       });
//       return map;
//     });

//     if (criteria["Employment type"]) job.jobType = criteria["Employment type"];
//     if (criteria["Seniority level"]) job.seniority = criteria["Seniority level"];
//     if (criteria["Industries"]) job.industry = criteria["Industries"];

//     return job;
//   } catch {
//     return null;
//   } finally {
//     await page.close();
//   }
// }
// async function scrapeDetail({ browser, job, timeout, retries }) {
//   if (!job.link) return null;

//   const page = await browser.newPage();
//   await preparePage(page);

//   try {
//     const ok = await retry(async () => {
//       await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
//       await page.waitForSelector('.description__text', { timeout });
//     }, retries);

//     if (!ok) return null;

//     job.description = await safeText(page, '.description__text');
//     job.jobType = await safeText(page, '.description__job-criteria-text', job.jobType);

//     // Wait for dynamic content (applicant count loads after JS renders)
//     await new Promise((r) => setTimeout(r, 1500));

//     job.applicants = await page.$eval('body', (body) => {
//       const all = [...body.querySelectorAll('span, li, div')];
//       const match = all
//         .map(el => el.textContent?.trim())
//         .find(text =>
//           text.length < 100 &&
//           (
//             /(\d+|over \d+)\s+applicants?/i.test(text) ||
//             /be among the first\s+\d+\s+applicants?/i.test(text) ||
//             /be an early applicant/i.test(text) ||
//             /actively recruiting/i.test(text)
//           )
//         );
//       return match || "";
//     }).catch(() => "");
    

//     // Get all criteria items
//     const criteria = await page.$$eval('.description__job-criteria-item', (items) => {
//       const map = {};
//       items.forEach((item) => {
//         const label = item.querySelector('.description__job-criteria-subheader')?.innerText?.trim() || "";
//         const value = item.querySelector('.description__job-criteria-text')?.innerText?.trim() || "";
//         map[label] = value;
//       });
//       return map;
//     });

//     if (criteria["Employment type"]) job.jobType = criteria["Employment type"];
//     if (criteria["Seniority level"]) job.seniority = criteria["Seniority level"];
//     if (criteria["Industries"]) job.industry = criteria["Industries"];

//     return job;
//   } catch {
//     return null;
//   } finally {
//     await page.close();
//   }
// }
async function scrapeDetail({ browser, job, timeout, retries }) {
  if (!job.link) return null;
if (!browser.isConnected()) return null; 
  const page = await browser.newPage();
  await preparePage(page);

  try {
    // ✅ Try guest API first for applicant count (no login needed)
    const jobId = job.link.split("-").pop();
    try {
      await page.goto(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`, {
        waitUntil: "domcontentloaded",
        timeout,
      });
      job.peoples = await page.$eval('body', (body) => {
        const text = body.innerText;
        const match = text.match(/(over \d+|\d+)\s*applicants?/i)
          || text.match(/be among the first\s*\d+\s*applicants?/i)
          || text.match(/be an early applicant/i)
          || text.match(/people clicked apply/i);
        return match ? match[0].trim() : "";
      }).catch(() => "");
    } catch {
      job.peoples = "";
    }

    // ✅ Now go to full job page for description + criteria
    const ok = await retry(async () => {
      await page.goto(job.link, { waitUntil: "domcontentloaded", timeout });
      await page.waitForSelector('.description__text', { timeout });
    }, retries);

    if (!ok) return null;

    job.description = await safeText(page, '.description__text');
    job.jobType = await safeText(page, '.description__job-criteria-text', job.jobType);

    await new Promise((r) => setTimeout(r, 1500));

    // ✅ Fallback: if guest API gave nothing, try from full page
    if (!job.peoples) {
      job.peoples = await page.$eval('body', (body) => {
        const all = [...body.querySelectorAll('span, li, div')];
        const match = all
          .map(el => el.textContent?.trim())
          .find(text =>
            text.length < 100 &&
            (
              /(\d+|over \d+)\s+applicants?/i.test(text) ||
              /be among the first\s+\d+\s+applicants?/i.test(text) ||
              /be an early applicant/i.test(text) ||
              /actively recruiting/i.test(text)
            )
          );
        return match || "";
      }).catch(() => "");
    }
    

    // ✅ Grab company description
   job.companyDescription = (() => {
  const desc = job.description || "";
  const markers = [
    "About the company",
    "About us", 
    "About ",  // catches "About Granite Construction..."
  ];
  for (const marker of markers) {
    const idx = desc.indexOf(marker);
    if (idx !== -1) {
      return desc.slice(idx).slice(0, 500).trim();
    }
  }
  return "";
})();

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