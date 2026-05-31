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



const chromium = require("@sparticuz/chromium");
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const pLimit = require("p-limit");

puppeteerExtra.use(StealthPlugin());

const SCRAPERS = {
  linkedin: require("./linkedin"),
  simplyhired: require("./simplyhired"),
  indeed: require("./indeed"),
  glassdoor: require("./glassdoor"),
};

const CONFIG = {
  TIMEOUT: 60000,
  RETRIES: 1,
  CONCURRENCY: 1,
};

// ==========================================
// CREATE BROWSER — one per board
// ==========================================

async function createBrowser() {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (await chromium.executablePath());

  console.log("Chrome Path:", executablePath);

  const browser = await puppeteerExtra.launch({
    headless: true,
    executablePath,
    ignoreHTTPSErrors: true,
    protocolTimeout: 300000,
    defaultViewport: { width: 1920, height: 1080 },
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

  browser.on("disconnected", () => {
    console.log("Browser disconnected");
  });

  return browser;
}

// ==========================================
// SCRAPE ONE BOARD — isolated browser
// ==========================================

async function scrapeBoard({
  board,
  keyword,
  location,
  skills,
  filters,
  targetPage,
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

  // ✅ Each board gets its OWN browser — crash isolation
  let browser;
  try {
    browser = await createBrowser();
  } catch (err) {
    onError(board, `Browser launch failed: ${err.message}`);
    return;
  }

  try {
    onProgress(`[${board}] Starting`);

    const jobs = await scraper.scrape({
      browser,
      keyword,
      location,
      filters,
      boardFilters: boardFilters?.[board] || {},
      targetPage,
      timeout: CONFIG.TIMEOUT,
      retries: CONFIG.RETRIES,
      onProgress: (message) => onProgress(`[${board}] ${message}`),
    });

    onProgress(`[${board}] Found ${jobs.length} jobs`);

    const detailLimit = pLimit(CONFIG.CONCURRENCY);

    await Promise.all(
      jobs.map((job, index) =>
        detailLimit(async () => {
          // ✅ Skip detail if browser already died
          if (!browser.isConnected()) {
            onProgress(`[${board}] Browser disconnected, skipping detail for job ${index + 1}`);
            job.matchedSkills = [];
            job.board = board;
            job.scrapedAt = new Date().toISOString();
            onJob(job);
            return;
          }

          try {
            let finalJob = job;

            if (scraper.scrapeDetail) {
              const detailed = await scraper.scrapeDetail({
                browser,
                job,
                timeout: 15000,
                retries: 1,
              });
              if (detailed) finalJob = detailed;
            }

            if (requiredSkills.length > 0) {
              const text = (
                finalJob.description || finalJob.title || ""
              ).toLowerCase();
              finalJob.matchedSkills = requiredSkills.filter((skill) =>
                text.includes(skill)
              );
            } else {
              finalJob.matchedSkills = [];
            }

            finalJob.board = board;
            finalJob.scrapedAt = new Date().toISOString();

            onJob(finalJob);
            onProgress(`[${board}] OK ${index + 1}/${jobs.length}`);
          } catch (err) {
            console.log(`[${board}] DETAIL ERROR:`, err.message);
            onProgress(`[${board}] Detail Error: ${err.message}`);

            // ✅ Still emit the base job even if detail fails
            job.matchedSkills = [];
            job.board = board;
            job.scrapedAt = new Date().toISOString();
            onJob(job);
          }
        })
      )
    );

    onProgress(`[${board}] Completed`);
    if (onBoardDone) onBoardDone(board);
  } catch (err) {
    console.log(`SCRAPER ERROR (${board})`, err);
    onError(board, err.message);
  } finally {
    // ✅ Close only THIS board's browser
    try {
      await browser.close();
    } catch {
      // already dead, ignore
    }
  }
}

// ==========================================
// MAIN
// ==========================================

async function scrapeJobs({
  keyword,
  location,
  skills,
  boards,
  filters,
  targetPage,
  boardFilters,
  onJob,
  onProgress,
  onError,
  onBoardDone,
}) {
  const requiredSkills = skills
    ? skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  // ✅ Run boards concurrently — each fully isolated
  const boardLimit = pLimit(2);

  await Promise.all(
    boards.map((board) =>
      boardLimit(() =>
        scrapeBoard({
          board,
          keyword,
          location,
          skills,
          filters,
          targetPage,
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