// // ======================================================
// // SCRAPER ORCHESTRATOR
// // ======================================================

// const puppeteer = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const pLimit = require("p-limit");

// puppeteer.use(StealthPlugin());

// const SCRAPERS = {
//   simplyhired: require("./simplyhired"),
//   indeed:      require("./indeed"),
//   dice:        require("./dice"),
//   monster:     require("./monster"),
//   glassdoor:   require("./glassdoor"),
//   linkedin:    require("./linkedin"),
// };

// const CONFIG = {
//   HEADLESS:    "new",
//   MAX_PAGES:   2,
//   TIMEOUT:     30000,
//   RETRIES:     1, // Reduced to prevent long hangs on blocked pages
//   CONCURRENCY: 5, // Increased slightly for faster detail processing
// };

// async function scrapeJobs({ keyword, location, skills, boards, filters, targetPage, boardFilters, onJob, onProgress, onError, onBoardDone }) {
//   const requiredSkills = skills
//     ? skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
//     : [];

//   const browser = await puppeteer.launch({
//     headless: CONFIG.HEADLESS,
//     defaultViewport: null,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--disable-gpu",
//       "--window-size=1920,1080",
//       "--disable-blink-features=AutomationControlled",
//     ],
//   });

//   try {
//     const boardLimit = pLimit(2);

//     await Promise.all(
//       boards.map((board) =>
//         boardLimit(async () => {
//           const scraper = SCRAPERS[board];
//           if (!scraper) {
//             onError(board, "No scraper found for " + board);
//             return;
//           }

//           try {
//             onProgress("Starting " + board + "...");

//             const jobs = await scraper.scrape({
//               browser,
//               keyword,
//               location,
//               filters,
//               boardFilters: boardFilters ? boardFilters[board] || {} : {},
//               targetPage: targetPage || 1,
//               timeout:    CONFIG.TIMEOUT,
//               retries:    CONFIG.RETRIES,
//               onProgress: (msg) => onProgress("[" + board + "] " + msg),
//             });

//             onProgress("[" + board + "] Found " + jobs.length + " listings. Fetching details...");

//             const detailLimit = pLimit(CONFIG.CONCURRENCY);

//             await Promise.all(
//               jobs.map((job, i) =>
//                 detailLimit(async () => {
//                   try {
//                     const detailed = await scraper.scrapeDetail({
//                       browser,
//                       job,
//                       timeout: 10000, // Reduced from global timeout to fail faster
//                       retries: 1,
//                     });

//                     const finalJob = detailed || job;
                    
//                     if (!detailed) {
//                       onProgress(`[${board}] WARN ${i + 1}/${jobs.length} (Detail blocked, using basic data)`);
//                     }

//                     if (requiredSkills.length > 0) {
//                       const text = (finalJob.description || finalJob.title || "").toLowerCase();
//                       const matched = requiredSkills.filter((s) => text.includes(s));
//                       finalJob.matchedSkills = matched;
                      
//                       // If we successfully fetched the description, apply strict filtering.
//                       if (detailed && matched.length < requiredSkills.length) {
//                         onProgress(`[${board}] SKIP ${i + 1}/${jobs.length} (Missing skills)`);
//                         return;
//                       }
//                     } else {
//                       finalJob.matchedSkills = [];
//                     }

//                     finalJob.board     = board;
//                     finalJob.scrapedAt = new Date().toISOString();

//                     // Apply board-specific post-scrape filtering
//                     if (boardFilters && boardFilters[board]) {
//                       const sf = boardFilters[board];
//                       if (board === "glassdoor" && sf.minRating && finalJob.rating) {
//                         const ratingNum = parseFloat(finalJob.rating);
//                         if (!isNaN(ratingNum) && ratingNum < parseFloat(sf.minRating)) return;
//                       }
//                     }

//                     onJob(finalJob);
//                     onProgress("[" + board + "] OK " + (i + 1) + "/" + jobs.length + " - " + finalJob.title);
//                   } catch (e) {
//                     onProgress(`[${board}] ERR ${i + 1}/${jobs.length} (${e.message})`);
//                   }
//                 })
//               )
//             );

//             onProgress("[" + board + "] Done.");
//             if (onBoardDone) onBoardDone(board);
//           } catch (err) {
//             onError(board, err.message);
//           }
//         })
//       )
//     );
//   } finally {
//     await browser.close();
//   }
// }

// module.exports = { scrapeJobs };

// ======================================================
// SCRAPER ORCHESTRATOR (Render Fixed Version)
// ======================================================

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const chromium = require("@sparticuz/chromium");
const pLimit = require("p-limit");

puppeteer.use(StealthPlugin());

const SCRAPERS = {
  simplyhired: require("./simplyhired"),
  indeed: require("./indeed"),
  dice: require("./dice"),
  monster: require("./monster"),
  glassdoor: require("./glassdoor"),
  linkedin: require("./linkedin"),
};

const CONFIG = {
  HEADLESS: true,
  MAX_PAGES: 2,
  TIMEOUT: 60000,
  RETRIES: 1,
  CONCURRENCY: 3,
};

// ======================================================
// CREATE BROWSER
// ======================================================

async function createBrowser() {

  // LOCAL
  // if (process.env.NODE_ENV !== "production") {
  //   return await puppeteer.launch({
  //     headless: "new",
  //     protocolTimeout: 300000,
  //     timeout: 120000,

  //     args: [
  //       "--no-sandbox",
  //       "--disable-setuid-sandbox",
  //       "--disable-dev-shm-usage",
  //       "--disable-accelerated-2d-canvas",
  //       "--disable-gpu",
  //       "--window-size=1920,1080",
  //     ],
  //   });
  // }

  // RENDER / PRODUCTION
  return await puppeteer.launch({
    headless: true,

    executablePath: await chromium.executablePath(),

    args: [
      ...chromium.args,

      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--single-process",
      "--no-zygote",
      "--disable-gpu",
    ],

    defaultViewport: chromium.defaultViewport,
  });
}

// ======================================================
// MAIN SCRAPER
// ======================================================

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
    ? skills
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const browser = await createBrowser();

  try {

    const boardLimit = pLimit(2);

    await Promise.all(
      boards.map((board) =>
        boardLimit(async () => {

          const scraper = SCRAPERS[board];

          if (!scraper) {
            onError(board, "No scraper found");
            return;
          }

          try {

            onProgress(`Starting ${board}...`);

            const jobs = await scraper.scrape({
              browser,
              keyword,
              location,
              filters,
              boardFilters: boardFilters?.[board] || {},
              targetPage: targetPage || 1,
              timeout: CONFIG.TIMEOUT,
              retries: CONFIG.RETRIES,

              onProgress: (msg) =>
                onProgress(`[${board}] ${msg}`),
            });

            onProgress(
              `[${board}] Found ${jobs.length} jobs`
            );

            const detailLimit = pLimit(CONFIG.CONCURRENCY);

            await Promise.all(
              jobs.map((job, index) =>
                detailLimit(async () => {

                  try {

                    let finalJob = job;

                    // =====================================
                    // DETAIL SCRAPE
                    // =====================================

                    if (scraper.scrapeDetail) {

                      const detailed =
                        await scraper.scrapeDetail({
                          browser,
                          job,
                          timeout: 15000,
                          retries: 1,
                        });

                      if (detailed) {
                        finalJob = detailed;
                      }
                    }

                    // =====================================
                    // SKILL MATCHING
                    // =====================================

                    if (requiredSkills.length > 0) {

                      const text = (
                        finalJob.description ||
                        finalJob.title ||
                        ""
                      ).toLowerCase();

                      const matchedSkills =
                        requiredSkills.filter((skill) =>
                          text.includes(skill)
                        );

                      finalJob.matchedSkills =
                        matchedSkills;

                    } else {
                      finalJob.matchedSkills = [];
                    }

                    // =====================================
                    // FINAL DATA
                    // =====================================

                    finalJob.board = board;

                    finalJob.scrapedAt =
                      new Date().toISOString();

                    // =====================================
                    // SEND JOB
                    // =====================================

                    onJob(finalJob);

                    onProgress(
                      `[${board}] OK ${index + 1}/${
                        jobs.length
                      } - ${finalJob.title}`
                    );

                  } catch (err) {

                    onProgress(
                      `[${board}] Detail Error: ${err.message}`
                    );
                  }
                })
              )
            );

            onProgress(`[${board}] Done`);

            if (onBoardDone) {
              onBoardDone(board);
            }

          } catch (err) {

            console.log(
              `SCRAPER ERROR ${board}:`,
              err
            );

            onError(board, err.message);
          }
        })
      )
    );

  } catch (err) {

    console.log("GLOBAL ERROR:", err);

  } finally {

    await browser.close();
  }
}

module.exports = { scrapeJobs };