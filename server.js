// ======================================================
// JOBHUNT AGGREGATOR - BACKEND SERVER
// ======================================================
// npm install && node server.js
// Runs on http://localhost:4000
// ======================================================

const express = require("express");
const cors = require("cors");
const { scrapeJobs } = require("./scrapers/index");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// In-memory job cache per session
let jobCache = [];

// ======================================================
// ROUTES
// ======================================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start scraping
app.post("/api/scrape", async (req, res) => {
  const {
    keyword = "frontend developer",
    location = "United States",
    skills = "",
    boards = ["simplyhired", "indeed", "dice", "monster", "glassdoor", "linkedin"],
    filters = {},
    targetPage = 1,
    boardFilters = {},
  } = req.body;

  console.log("\n=============================");
  console.log("NEW SCRAPE REQUEST");
  console.log("Keyword   :", keyword);
  console.log("Location  :", location);
  console.log("Skills    :", skills);
  console.log("Boards    :", boards);
  console.log("TargetPage:", targetPage);
  console.log("=============================\n");

  // Stream results using SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    jobCache = [];

    await scrapeJobs({
      keyword,
      location,
      skills,
      boards,
      filters,
      targetPage,
      boardFilters,
      onJob: (job) => {
        jobCache.push(job);
        sendEvent("job", { job });
      },
      onProgress: (msg) => {
        sendEvent("progress", { message: msg });
      },
      onError: (board, msg) => {
        sendEvent("error", { board, message: msg });
      },
      onBoardDone: (board) => {
        sendEvent("board_done", { board });
      },
    });

    sendEvent("done", { total: jobCache.length });
  } catch (err) {
    sendEvent("error", { board: "global", message: err.message });
  } finally {
    res.end();
  }
});

// Get cached jobs
app.get("/api/jobs", (req, res) => {
  res.json({ jobs: jobCache, total: jobCache.length });
});

// Export jobs as CSV
app.get("/api/export/csv", (req, res) => {
  if (!jobCache.length) {
    return res.status(404).json({ error: "No jobs cached" });
  }

  const headers = [
    "title", "company", "location", "salary",
    "jobType", "posted", "board", "matchedSkills", "link", "scrapedAt"
  ];

  const escape = (val) => {
    if (val === undefined || val === null) return "";
    const s = Array.isArray(val) ? val.join("|") : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const rows = [
    headers.join(","),
    ...jobCache.map((job) => headers.map((h) => escape(job[h])).join(",")),
  ];

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="jobs.csv"');
  res.send(rows.join("\n"));
});

// Export jobs as JSON
app.get("/api/export/json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="jobs.json"');
  res.json(jobCache);
});

app.listen(PORT, () => {
  console.log(`\nJobHunt Backend running on http://localhost:${PORT}`);
});
