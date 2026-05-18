const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require('fs');

async function debugHTML() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  
  // Test Dice
  console.log("Fetching Dice...");
  await page.goto("https://www.dice.com/jobs?q=react&location=remote", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(3000); // Wait a bit for JS to render
  const diceHtml = await page.content();
  fs.writeFileSync("dice_debug.html", diceHtml);
  console.log("Saved dice_debug.html");

  // Test Monster
  console.log("Fetching Monster...");
  await page.goto("https://www.monster.com/jobs/search?q=react&where=remote", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(3000);
  const monsterHtml = await page.content();
  fs.writeFileSync("monster_debug.html", monsterHtml);
  console.log("Saved monster_debug.html");

  await browser.close();
}

debugHTML().catch(console.error);
