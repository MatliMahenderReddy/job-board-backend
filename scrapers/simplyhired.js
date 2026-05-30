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




// ======================================================
// SIMPLYHIRED SCRAPER
// ======================================================

const { preparePage, safeText, retry } = require("./utils");

async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
  const page = await browser.newPage();
  await preparePage(page);
  let allJobs = [];

  try {
    const p = targetPage;
   const params = new URLSearchParams();

// Required params
if (keyword) params.set("q", keyword);
if (location) params.set("l", location);
// if (p) params.set("pn", p);

// Date posted
if (filters?.datePosted) {
const datePosted =["12h", "6h", "3h"].includes(filters?.datePosted)
  ? "1"
  : filters?.datePosted;
  params.set("t", datePosted);
}

// Sort
if (filters?.sort === "newest") {
  params.set("s", "d");
}

// Job Type
if (filters?.jobType) {
  const jobTypeMap = {
    fulltime: "CF3CP",
    parttime: "75GKK",
    internship: "VDTG7",
  };

  if (jobTypeMap[filters.jobType]) {
    params.set("jt", jobTypeMap[filters.jobType]);
  }
}

// Salary
if (filters?.salary) {
  const salaryMap = {
    "50k": 50000,
    "100k": 100000,
    "150k": 150000,
  };

  if (salaryMap[filters.salary]) {
    params.set("mip", salaryMap[filters.salary]);
  }
}

const url = `https://www.simplyhired.com/search?${params.toString()}`;
console.log("url",url)
      onProgress(`Page ${p}: ${url}`);

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout });
        await page.waitForSelector('[data-testid="searchSerpJob"]', { timeout: 20000 });

        const jobs = await page.$$eval('[data-testid="searchSerpJob"]', (cards) =>
          cards.map((card) => {
            const anchor = card.querySelector('[data-testid="searchSerpJobTitle"] a');
            let link = anchor?.href || "";
            if (link.startsWith("/")) link = "https://www.simplyhired.com" + link;

            return {
              title: anchor?.innerText?.trim() || "",
              company: card.querySelector('[data-testid="companyName"]')?.innerText?.trim() || "",
              location: card.querySelector('[data-testid="searchSerpJobLocation"]')?.innerText?.trim() || "",
              salary: card.querySelector('[data-testid="searchSerpJobSalaryEst"]')?.innerText?.trim() || "",
              posted: card.querySelector('[data-testid="searchSerpJobDateStamp"]')?.innerText?.trim() || "",
              jobType: card.querySelector('[data-testid^="jobTypeChip"]')?.innerText?.trim() || "",
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
      await page.waitForSelector('[data-testid="viewJobBodyJobFullDescriptionContent"]', { timeout: 15000 });
    }, retries);

    if (!ok) return null;

    job.description = await safeText(page, '[data-testid="viewJobBodyJobFullDescriptionContent"]');
    job.jobType = await safeText(page, '[data-testid="viewJobBodyJobDetailsJobType"] [data-testid="detailText"]', job.jobType);
    job.posted = await safeText(page, '[data-testid="viewJobBodyJobPostingTimestamp"] [data-testid="detailText"]', job.posted);

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
