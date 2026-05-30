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
// GLASSDOOR SCRAPER
// ======================================================

const { preparePage, safeText, retry } = require("./utils");

async function scrape({ browser, keyword, location, filters, targetPage, timeout, onProgress }) {
  const page = await browser.newPage();
  await preparePage(page);
  let allJobs = [];

  try {
    const p = targetPage;
    // const encodedKeyword = encodeURIComponent(keyword.replace(/\s+/g, "-"));
    // const encodedLocation = encodeURIComponent(location.replace(/\s+/g, "-"));
    const encodedKeyword  = keyword.trim().toLowerCase().replace(/\s+/g, "-");
const encodedLocation = location.trim().toLowerCase().replace(/\s+/g, "-");
    console.log("location",location)
    console.log("filters",filters)
   const filter = {};

if (filters?.datePosted)    filter.fromAge       = ["12h", "6h", "3h"].includes(filters?.datePosted)? "1": filters?.datePosted;;
if (filters?.employerSizes) filter.employerSizes = filters.employerSizes;
if (filters?.sort === "newest") filter.sortBy    = "date_desc";
if (filters?.salary) {
  filter.maxSalary =
    filters.salary === "50k"  ? 50000  :
    filters.salary === "100k" ? 100000 : 150000; // ✅ no comma
}

// Build query string from filter object
const filterParams = new URLSearchParams({ p, ...filter }).toString();
const locLen = encodedLocation.length;  // "united-states" = 13
const kwEnd  = locLen + 1 + encodedKeyword.length;
// const url = `https://www.glassdoor.com/Job/${encodedLocation}-${encodedKeyword}-jobs-SRCH_IL.0,${encodedLocation.length}_IN1_KO${encodedLocation.length + 1},${encodedLocation.length + 1 + encodedKeyword.length}.htm?${filterParams}`;
const url = `https://www.glassdoor.co.in/Job/${encodedLocation}-${encodedKeyword}-jobs-SRCH_IL.0,${locLen}_IN1_KO${locLen + 1},${kwEnd}.htm?${filterParams}`;
console.log("url",url)
    onProgress(`Page ${p}: ${url}`);

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout });
        await page.waitForSelector('[data-test="jobListing"]', { timeout: 20000 });

        const jobs = await page.$$eval('[data-test="jobListing"]', (cards) =>
          cards.map((card) => {
            // const anchor = card.querySelector('a[data-test="job-title"]') || card.querySelector('.job-t
                 const anchor =  card.querySelector('a[href*="job-listing"]')||card.querySelector('a[data-test="job-title"]') || card.querySelector('.job-title a');
           

let link = "";
if (anchor) {
  const href = anchor.getAttribute("href") || "";
  link = href.startsWith("http")
    ? href
    : `https://www.glassdoor.com${href}`;    // ✅ produces full valid URL
}
        const companyEl =
            card.querySelector('[data-test="employer-short-name"]') ||
            card.querySelector('span[class*="EmployerProfile"]') ||
            card.querySelector('heading_Heading__aomVx heading_Subhead__jiUbT"]') ||
            card.querySelector('[data-test="employer-name"]'); // legacy fallback
            return {
              title: anchor?.innerText?.trim() || card.querySelector('.job-title')?.innerText?.trim() || "",
              company: companyEl?.innerText?.trim() || "",
              location: card.querySelector('[data-test="emp-location"]')?.innerText?.trim() || "",
              salary: card.querySelector('[data-test="detailSalary"]')?.innerText?.trim() || "",
              posted: card.querySelector('[data-test="job-age"]')?.innerText?.trim() || "",
              jobType: card.querySelector('[data-test="job-type"]')?.innerText?.trim() || "",
              rating: card.querySelector('[data-test="rating"]')?.innerText?.trim() || "",
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
      await page.waitForSelector('[data-test="jobDescriptionContent"]', { timeout: 15000 });
    }, retries);

    if (!ok) return null;

    job.description = await safeText(page, '[data-test="jobDescriptionContent"]');

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
