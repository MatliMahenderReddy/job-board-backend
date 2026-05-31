// const chromium = require("@sparticuz/chromium");
// const puppeteer = require("puppeteer-core");
// const puppeteerExtra = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const pLimit = require("p-limit");

// puppeteerExtra.use(StealthPlugin());

// // ==========================================
// // SCRAPERS
// // ==========================================

// const SCRAPERS = {
//   linkedin: require("./linkedin"),
//   simplyhired: require("./simplyhired"),
//   indeed: require("./indeed"),
//   glassdoor: require("./glassdoor"),
//   // dice: require("./dice"),
//   // monster: require("./monster"),
  
// };

// // ==========================================
// // CONFIG
// // ==========================================

// const CONFIG = {
//   HEADLESS: true,
//   TIMEOUT: 60000,
//   RETRIES: 1,
//   CONCURRENCY: 1,
// };

// // ==========================================
// // CREATE BROWSER
// // ==========================================

// async function createBrowser() {
//   try {
//     const executablePath =
//       process.env.PUPPETEER_EXECUTABLE_PATH ||
//       (await chromium.executablePath());

//     console.log("Chrome Path:", executablePath);

//     const browser = await puppeteerExtra.launch({
//       headless: true,

//       executablePath,

//       ignoreHTTPSErrors: true,

//       protocolTimeout: 300000,

//       defaultViewport: {
//         width: 1920,
//         height: 1080,
//       },

//       args: [
//         ...chromium.args,

//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-accelerated-2d-canvas",
//         "--disable-gpu",
//         "--window-size=1920,1080",
//         "--single-process",
//         "--no-zygote",
//         "--disable-web-security",
//       ],
//     });

//     browser.on("disconnected", () => {
//       console.log("Browser disconnected");
//     });

//     return browser;
//   } catch (error) {
//     console.log("BROWSER CREATE ERROR:", error);
//     throw error;
//   }
// }

// // ==========================================
// // MAIN
// // ==========================================

// async function scrapeJobs({
//   keyword,
//   location,
//   skills,
//   boards,
//   filters,
//   targetPage,
//   boardFilters,
//   onJob,
//   onProgress,
//   onError,
//   onBoardDone,
// }) {
//   const requiredSkills = skills
//     ? skills
//         .split(",")
//         .map((s) => s.trim().toLowerCase())
//         .filter(Boolean)
//     : [];

//   let browser;

//   try {
//     browser = await createBrowser();

//     const boardLimit = pLimit(2);

//     await Promise.all(
//       boards.map((board) =>
//         boardLimit(async () => {
//           const scraper = SCRAPERS[board];

//           if (!scraper) {
//             onError(board, "Scraper not found");
//             return;
//           }

//           try {
//             onProgress(`[${board}] Starting`);

//             const jobs = await scraper.scrape({
//               browser,
//               keyword,
//               location,
//               filters,
//               boardFilters: boardFilters?.[board] || {},
//               targetPage,
//               timeout: CONFIG.TIMEOUT,
//               retries: CONFIG.RETRIES,

//               onProgress: (message) => {
//                 onProgress(`[${board}] ${message}`);
//               },
//             });

//             onProgress(
//               `[${board}] Found ${jobs.length} jobs`
//             );

//             const detailLimit = pLimit(CONFIG.CONCURRENCY);

//             await Promise.all(
//               jobs.map((job, index) =>
//                 detailLimit(async () => {
//                   try {
//                     let finalJob = job;

//                     // ==========================================
//                     // DETAIL PAGE
//                     // ==========================================

//                     if (scraper.scrapeDetail) {
//                       const detailed =
//                         await scraper.scrapeDetail({
//                           browser,
//                           job,
//                           timeout: 15000,
//                           retries: 1,
//                         });

//                       if (detailed) {
//                         finalJob = detailed;
//                       }
//                     }

//                     // ==========================================
//                     // SKILLS MATCH
//                     // ==========================================

//                     if (requiredSkills.length > 0) {
//                       const text = (
//                         finalJob.description ||
//                         finalJob.title ||
//                         ""
//                       ).toLowerCase();

//                       finalJob.matchedSkills =
//                         requiredSkills.filter((skill) =>
//                           text.includes(skill)
//                         );
//                     } else {
//                       finalJob.matchedSkills = [];
//                     }

//                     // ==========================================
//                     // FINALIZE
//                     // ==========================================

//                     finalJob.board = board;

//                     finalJob.scrapedAt =
//                       new Date().toISOString();

//                     onJob(finalJob);

//                     onProgress(
//                       `[${board}] OK ${index + 1}/${jobs.length}`
//                     );
//                   } catch (err) {
//                     console.log(
//                       `[${board}] DETAIL ERROR:`,
//                       err.message
//                     );

//                     onProgress(
//                       `[${board}] Detail Error: ${err.message}`
//                     );
//                   }
//                 })
//               )
//             );

//             onProgress(`[${board}] Completed`);

//             if (onBoardDone) {
//               onBoardDone(board);
//             }
//           } catch (err) {
//             console.log(
//               `SCRAPER ERROR (${board})`,
//               err
//             );

//             onError(board, err.message);
//           }
//         })
//       )
//     );
//   } catch (err) {
//     console.log("GLOBAL SCRAPER ERROR:", err);
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// }

// module.exports = {
//   scrapeJobs,
// };

// --------------------------31-05-26:11:51

// const chromium = require("@sparticuz/chromium");
// const puppeteerExtra = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const pLimit = require("p-limit");

// puppeteerExtra.use(StealthPlugin());

// const SCRAPERS = {
//   linkedin: require("./linkedin"),
//   simplyhired: require("./simplyhired"),
//   indeed: require("./indeed"),
//   glassdoor: require("./glassdoor"),
// };

// const CONFIG = {
//   TIMEOUT: 60000,
//   RETRIES: 1,
//   CONCURRENCY: 1,
// };

// // ==========================================
// // CREATE BROWSER — one per board
// // ==========================================

// async function createBrowser() {
//   const executablePath =
//     process.env.PUPPETEER_EXECUTABLE_PATH ||
//     (await chromium.executablePath());

//   console.log("Chrome Path:", executablePath);

//   const browser = await puppeteerExtra.launch({
//     headless: true,
//     executablePath,
//     ignoreHTTPSErrors: true,
//     protocolTimeout: 300000,
//     defaultViewport: { width: 1920, height: 1080 },
//     args: [
//       ...chromium.args,
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--disable-gpu",
//       "--window-size=1920,1080",
//       "--single-process",
//       "--no-zygote",
//       "--disable-web-security",
//     ],
//   });

//   browser.on("disconnected", () => {
//     console.log("Browser disconnected");
//   });

//   return browser;
// }

// // ==========================================
// // SCRAPE ONE BOARD — isolated browser
// // ==========================================

// async function scrapeBoard({
//   board,
//   keyword,
//   location,
//   skills,
//   filters,
//   targetPage,
//   boardFilters,
//   requiredSkills,
//   onJob,
//   onProgress,
//   onError,
//   onBoardDone,
// }) {
//   const scraper = SCRAPERS[board];

//   if (!scraper) {
//     onError(board, "Scraper not found");
//     return;
//   }

//   // ✅ Each board gets its OWN browser — crash isolation
//   let browser;
//   try {
//     browser = await createBrowser();
//   } catch (err) {
//     onError(board, `Browser launch failed: ${err.message}`);
//     return;
//   }

//   try {
//     onProgress(`[${board}] Starting`);

//     const jobs = await scraper.scrape({
//       browser,
//       keyword,
//       location,
//       filters,
//       boardFilters: boardFilters?.[board] || {},
//       targetPage,
//       timeout: CONFIG.TIMEOUT,
//       retries: CONFIG.RETRIES,
//       onProgress: (message) => onProgress(`[${board}] ${message}`),
//     });

//     onProgress(`[${board}] Found ${jobs.length} jobs`);

//     const detailLimit = pLimit(CONFIG.CONCURRENCY);

//     await Promise.all(
//       jobs.map((job, index) =>
//         detailLimit(async () => {
//           // ✅ Skip detail if browser already died
//           if (!browser.isConnected()) {
//             onProgress(`[${board}] Browser disconnected, skipping detail for job ${index + 1}`);
//             job.matchedSkills = [];
//             job.board = board;
//             job.scrapedAt = new Date().toISOString();
//             onJob(job);
//             return;
//           }

//           try {
//             let finalJob = job;

//             if (scraper.scrapeDetail) {
//               const detailed = await scraper.scrapeDetail({
//                 browser,
//                 job,
//                 timeout: 15000,
//                 retries: 1,
//               });
//               if (detailed) finalJob = detailed;
//             }

//             if (requiredSkills.length > 0) {
//               const text = (
//                 finalJob.description || finalJob.title || ""
//               ).toLowerCase();
//               finalJob.matchedSkills = requiredSkills.filter((skill) =>
//                 text.includes(skill)
//               );
//             } else {
//               finalJob.matchedSkills = [];
//             }

//             finalJob.board = board;
//             finalJob.scrapedAt = new Date().toISOString();

//             onJob(finalJob);
//             onProgress(`[${board}] OK ${index + 1}/${jobs.length}`);
//           } catch (err) {
//             console.log(`[${board}] DETAIL ERROR:`, err.message);
//             onProgress(`[${board}] Detail Error: ${err.message}`);

//             // ✅ Still emit the base job even if detail fails
//             job.matchedSkills = [];
//             job.board = board;
//             job.scrapedAt = new Date().toISOString();
//             onJob(job);
//           }
//         })
//       )
//     );

//     onProgress(`[${board}] Completed`);
//     if (onBoardDone) onBoardDone(board);
//   } catch (err) {
//     console.log(`SCRAPER ERROR (${board})`, err);
//     onError(board, err.message);
//   } finally {
//     // ✅ Close only THIS board's browser
//     try {
//       await browser.close();
//     } catch {
//       // already dead, ignore
//     }
//   }
// }

// // ==========================================
// // MAIN
// // ==========================================

// async function scrapeJobs({
//   keyword,
//   location,
//   skills,
//   boards,
//   filters,
//   targetPage,
//   boardFilters,
//   onJob,
//   onProgress,
//   onError,
//   onBoardDone,
// }) {
//   const requiredSkills = skills
//     ? skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
//     : [];

//   // ✅ Run boards concurrently — each fully isolated
//   const boardLimit = pLimit(2);

//   await Promise.all(
//     boards.map((board) =>
//       boardLimit(() =>
//         scrapeBoard({
//           board,
//           keyword,
//           location,
//           skills,
//           filters,
//           targetPage,
//           boardFilters,
//           requiredSkills,
//           onJob,
//           onProgress,
//           onError,
//           onBoardDone,
//         })
//       )
//     )
//   );
// }

// module.exports = { scrapeJobs };


// ======================================================
// SCRAPERS INDEX — Production Multi-Page
// ======================================================
// Each board gets its own browser for full crash isolation.
// Supports any targetPage (1, 2, 3...) for all boards.
// ======================================================

const chromium   = require("@sparticuz/chromium");
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin  = require("puppeteer-extra-plugin-stealth");
const pLimit     = require("p-limit");

puppeteerExtra.use(StealthPlugin());

// ─────────────────────────────────────────────────────
// SCRAPER REGISTRY
// ─────────────────────────────────────────────────────
const SCRAPERS = {
  linkedin:    require("./linkedin"),
  simplyhired: require("./simplyhired"),
  indeed:      require("./indeed"),
  glassdoor:   require("./glassdoor"),
};

// ─────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────
const CONFIG = {
  TIMEOUT:          60000,
  DETAIL_TIMEOUT:   20000,
  RETRIES:          1,
  DETAIL_CONCURRENCY: 1,
  BOARD_CONCURRENCY:  2, // how many boards run in parallel
};

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
const sleep  = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─────────────────────────────────────────────────────
// CREATE BROWSER — called once per board
// ─────────────────────────────────────────────────────
async function createBrowser() {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (await chromium.executablePath());

  console.log("Chrome Path:", executablePath);

  const browser = await puppeteerExtra.launch({
    headless:           true,
    executablePath,
    ignoreHTTPSErrors:  true,
    protocolTimeout:    300000,
    defaultViewport:    { width: 1920, height: 1080 },
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920,1080",
      "--single-process",
      "--no-zygote",
      "--disable-web-security",
    ],
  });

  browser.on("disconnected", () =>
    console.log("[browser] disconnected")
  );

  return browser;
}

// ─────────────────────────────────────────────────────
// SCRAPE ONE BOARD (isolated browser, all pages)
// ─────────────────────────────────────────────────────
async function scrapeBoard({
  board,
  keyword,
  location,
  filters,
  pages,          // array of page numbers e.g. [1,2,3]
  boardFilters,
  requiredSkills,
  onJob,
  onProgress,
  onError,
  onBoardDone,
}) {
  const scraper = SCRAPERS[board];
  if (!scraper) {
    onError(board, "Scraper not found");
    return;
  }

  let browser;
  try {
    browser = await createBrowser();
  } catch (err) {
    onError(board, `Browser launch failed: ${err.message}`);
    return;
  }

  try {
    onProgress(`[${board}] Starting — pages: ${pages.join(", ")}`);

    let allJobs = [];

    // ── Scrape every requested page sequentially ──────────────────────────
    for (const pageNum of pages) {
      if (!browser.isConnected()) {
        onProgress(`[${board}] Browser died, stopping at page ${pageNum}`);
        break;
      }

      try {
        onProgress(`[${board}] Scraping page ${pageNum}`);

        const jobs = await scraper.scrape({
          browser,
          keyword,
          location,
          filters,
          boardFilters: boardFilters?.[board] || {},
          targetPage:   pageNum,
          timeout:      CONFIG.TIMEOUT,
          retries:      CONFIG.RETRIES,
          onProgress:   (msg) => onProgress(`[${board}] ${msg}`),
        });

        onProgress(`[${board}] Page ${pageNum}: ${jobs.length} jobs`);
        allJobs.push(...jobs);

        // Polite delay between pages (avoids rate limits)
        if (pages.indexOf(pageNum) < pages.length - 1) {
          await sleep(jitter(1200, 2500));
        }
      } catch (err) {
        onProgress(`[${board}] Page ${pageNum} error: ${err.message}`);
        // Don't abort remaining pages on a single page failure
      }
    }

    // Deduplicate across all pages
    allJobs = dedup(allJobs);
    onProgress(`[${board}] Total unique jobs: ${allJobs.length}`);

    // ── Detail pages ──────────────────────────────────────────────────────
    const detailLimit = pLimit(CONFIG.DETAIL_CONCURRENCY);

    await Promise.all(
      allJobs.map((job, idx) =>
        detailLimit(async () => {
          if (!browser.isConnected()) {
            // Emit base job without detail
            finalizeJob(job, requiredSkills, board);
            onJob(job);
            return;
          }

          try {
            let finalJob = job;

            if (scraper.scrapeDetail) {
              const detailed = await scraper.scrapeDetail({
                browser,
                job,
                timeout: CONFIG.DETAIL_TIMEOUT,
                retries: CONFIG.RETRIES,
              });
              if (detailed) finalJob = detailed;
            }

            finalizeJob(finalJob, requiredSkills, board);
            onJob(finalJob);
            onProgress(`[${board}] ✓ ${idx + 1}/${allJobs.length} — ${finalJob.title}`);
          } catch (err) {
            onProgress(`[${board}] Detail error (${idx + 1}): ${err.message}`);
            // Still emit base job
            finalizeJob(job, requiredSkills, board);
            onJob(job);
          }
        })
      )
    );

    onProgress(`[${board}] Completed`);
    onBoardDone?.(board);

  } catch (err) {
    console.error(`[${board}] Fatal error:`, err);
    onError(board, err.message);
  } finally {
    try { await browser.close(); } catch { /* already dead */ }
  }
}

// ─────────────────────────────────────────────────────
// FINALIZE JOB — skills + metadata
// ─────────────────────────────────────────────────────
function finalizeJob(job, requiredSkills, board) {
  if (requiredSkills.length > 0) {
    const text = (job.description || job.title || "").toLowerCase();
    job.matchedSkills = requiredSkills.filter((s) => text.includes(s));
  } else {
    job.matchedSkills = [];
  }
  job.board     = board;
  job.scrapedAt = new Date().toISOString();
}

// ─────────────────────────────────────────────────────
// DEDUP
// ─────────────────────────────────────────────────────
function dedup(jobs) {
  const map = new Map();
  for (const job of jobs) {
    const key = `${job.title}||${job.company}||${job.link}`;
    if (!map.has(key)) map.set(key, job);
  }
  return [...map.values()];
}

// ─────────────────────────────────────────────────────
// MAIN ENTRY — called from server.js
// ─────────────────────────────────────────────────────
async function scrapeJobs({
  keyword,
  location,
  skills,
  boards,
  filters,
  targetPage  = 1,
  totalPages  = 1,   // ← NEW: how many pages to scrape per board
  boardFilters,
  onJob,
  onProgress,
  onError,
  onBoardDone,
}) {
  const requiredSkills = skills
    ? skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  // Build the pages array: [1], [1,2], [1,2,3], etc.
  // If caller passes targetPage=2, totalPages=3 → pages = [2,3,4]
  const pages = Array.from(
    { length: totalPages },
    (_, i) => targetPage + i
  );

  const boardLimit = pLimit(CONFIG.BOARD_CONCURRENCY);

  await Promise.all(
    boards.map((board) =>
      boardLimit(() =>
        scrapeBoard({
          board,
          keyword,
          location,
          filters,
          pages,
          boardFilters,
          requiredSkills,
          onJob,
          onProgress,
          onError,
          onBoardDone,
        })
      )
    )
  );
}

module.exports = { scrapeJobs };