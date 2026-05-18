// ======================================================
// SHARED SCRAPER UTILITIES
// ======================================================

async function preparePage(page) {
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });
}

async function safeText(page, selector, fallback = "") {
  try {
    return await page.$eval(selector, (el) => el.innerText.trim());
  } catch {
    return fallback;
  }
}

async function retry(fn, retries = 2) {
  for (let i = 1; i <= retries; i++) {
    try {
      await fn();
      return true;
    } catch (err) {
      if (i === retries) return false;
    }
  }
  return false;
}

function dedup(jobs) {
  const map = new Map();
  for (const job of jobs) {
    const key = `${job.title}-${job.company}-${job.link}`;
    if (!map.has(key)) map.set(key, job);
  }
  return [...map.values()];
}

module.exports = { preparePage, safeText, retry, dedup };
