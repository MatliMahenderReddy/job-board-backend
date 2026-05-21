const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const pLimit = require("p-limit");

puppeteerExtra.use(StealthPlugin());

// ==========================================
// SCRAPERS
// ==========================================

const SCRAPERS = {
  simplyhired: require("./simplyhired"),
  indeed: require("./indeed"),
  dice: require("./dice"),
  monster: require("./monster"),
  glassdoor: require("./glassdoor"),
  linkedin: require("./linkedin"),
};

// ==========================================
// CONFIG
// ==========================================

const CONFIG = {
  HEADLESS: true,
  TIMEOUT: 60000,
  RETRIES: 1,
  CONCURRENCY: 1,
};

// ==========================================
// CREATE BROWSER
// ==========================================

async function createBrowser() {
  try {
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      (await chromium.executablePath());

    console.log("Chrome Path:", executablePath);

    const browser = await puppeteerExtra.launch({
      headless: true,

      executablePath,

      ignoreHTTPSErrors: true,

      protocolTimeout: 300000,

      defaultViewport: {
        width: 1920,
        height: 1080,
      },

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
  } catch (error) {
    console.log("BROWSER CREATE ERROR:", error);
    throw error;
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
    ? skills
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

  let browser;

  try {
    browser = await createBrowser();

    const boardLimit = pLimit(2);

    await Promise.all(
      boards.map((board) =>
        boardLimit(async () => {
          const scraper = SCRAPERS[board];

          if (!scraper) {
            onError(board, "Scraper not found");
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

              onProgress: (message) => {
                onProgress(`[${board}] ${message}`);
              },
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

                    // ==========================================
                    // DETAIL PAGE
                    // ==========================================

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

                    // ==========================================
                    // SKILLS MATCH
                    // ==========================================

                    if (requiredSkills.length > 0) {
                      const text = (
                        finalJob.description ||
                        finalJob.title ||
                        ""
                      ).toLowerCase();

                      finalJob.matchedSkills =
                        requiredSkills.filter((skill) =>
                          text.includes(skill)
                        );
                    } else {
                      finalJob.matchedSkills = [];
                    }

                    // ==========================================
                    // FINALIZE
                    // ==========================================

                    finalJob.board = board;

                    finalJob.scrapedAt =
                      new Date().toISOString();

                    onJob(finalJob);

                    onProgress(
                      `[${board}] OK ${index + 1}/${jobs.length}`
                    );
                  } catch (err) {
                    console.log(
                      `[${board}] DETAIL ERROR:`,
                      err.message
                    );

                    onProgress(
                      `[${board}] Detail Error: ${err.message}`
                    );
                  }
                })
              )
            );

            onProgress(`[${board}] Completed`);

            if (onBoardDone) {
              onBoardDone(board);
            }
          } catch (err) {
            console.log(
              `SCRAPER ERROR (${board})`,
              err
            );

            onError(board, err.message);
          }
        })
      )
    );
  } catch (err) {
    console.log("GLOBAL SCRAPER ERROR:", err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  scrapeJobs,
};