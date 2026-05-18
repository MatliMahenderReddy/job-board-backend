const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  
  // Stealth overrides
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  try {
    await page.goto("https://www.indeed.com/jobs?q=frontend+developer&l=United+States&start=0", { waitUntil: "domcontentloaded", timeout: 30000 });
    
    // Wait for a bit just in case
    await new Promise(r => setTimeout(r, 5000));
    
    // Take a screenshot
    await page.screenshot({ path: "indeed_debug.png", fullPage: true });

    // Dump HTML
    const html = await page.content();
    fs.writeFileSync("indeed_debug.html", html);
    
    console.log("Screenshot and HTML saved.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
})();
