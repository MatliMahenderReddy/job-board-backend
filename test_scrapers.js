// const puppeteer = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// puppeteer.use(StealthPlugin());

// const simplyhired = require("./scrapers/simplyhired");
// const dice = require("./scrapers/dice");
// const monster = require("./scrapers/monster");

// async function run() {
//   const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
//   console.log("Testing SimplyHired...");
//   try {
//     const jobs = await simplyhired.scrape({
//       browser, keyword: "react", location: "remote", filters: {}, targetPage: 1, timeout: 15000, onProgress: console.log
//     });
//     console.log("SimplyHired jobs found:", jobs.length);
//   } catch (e) { console.error("SimplyHired error:", e); }

//   console.log("\nTesting Dice...");
//   try {
//     const jobs = await dice.scrape({
//       browser, keyword: "react", location: "remote", filters: {}, targetPage: 1, timeout: 15000, onProgress: console.log
//     });
//     console.log("Dice jobs found:", jobs.length);
//   } catch (e) { console.error("Dice error:", e); }

//   console.log("\nTesting Monster...");
//   try {
//     const jobs = await monster.scrape({
//       browser, keyword: "react", location: "remote", filters: {}, targetPage: 1, timeout: 15000, onProgress: console.log
//     });
//     console.log("Monster jobs found:", jobs.length);
//   } catch (e) { console.error("Monster error:", e); }

//   await browser.close();
// }
// run();

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const simplyhired = require("./scrapers/simplyhired");
const dice = require("./scrapers/dice");
const monster = require("./scrapers/monster");

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",

    protocolTimeout: 300000,

    timeout: 120000,

    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920,1080",
      "--single-process",
      "--no-zygote"
    ]
  });

  try {
    console.log("Testing SimplyHired...");

    const jobs1 = await simplyhired.scrape({
      browser,
      keyword: "react",
      location: "remote",
      filters: {},
      targetPage: 1,
      timeout: 60000,
      onProgress: console.log
    });

    console.log("SimplyHired jobs found:", jobs1.length);

    console.log("\nTesting Dice...");

    const jobs2 = await dice.scrape({
      browser,
      keyword: "react",
      location: "remote",
      filters: {},
      targetPage: 1,
      timeout: 60000,
      onProgress: console.log
    });

    console.log("Dice jobs found:", jobs2.length);

    console.log("\nTesting Monster...");

    const jobs3 = await monster.scrape({
      browser,
      keyword: "react",
      location: "remote",
      filters: {},
      targetPage: 1,
      timeout: 60000,
      onProgress: console.log
    });

    console.log("Monster jobs found:", jobs3.length);

  } catch (err) {
    console.error("Main Error:", err);
  } finally {
    await browser.close();
  }
}

run();