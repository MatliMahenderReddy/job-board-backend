// // ======================================================
// // JOBHUNT AGGREGATOR - BACKEND SERVER
// // ======================================================
// // npm install && node server.js
// // Runs on http://localhost:4000
// // ======================================================
// const express = require("express");
// const cors = require("cors");
// const compression = require("compression");
// const { scrapeJobs } = require("./scrapers");

// const app = express();

// const PORT = process.env.PORT || 4000;

// // ==========================================
// // MIDDLEWARE
// // ==========================================

// app.use(cors());

// app.use(express.json({ limit: "10mb" }));

// // IMPORTANT:
// // Disable compression for SSE
// app.use(
//   compression({
//     filter: (req, res) => {
//       if (req.headers.accept === "text/event-stream") {
//         return false;
//       }
//       return compression.filter(req, res);
//     },
//   })
// );

// // Prevent timeout on Render
// app.use((req, res, next) => {
//   req.setTimeout(0);
//   res.setTimeout(0);
//   next();
// });

// // ==========================================
// // CACHE
// // ==========================================

// let jobCache = [];

// // ==========================================
// // HEALTH
// // ==========================================

// app.get("/api/health", (req, res) => {
//   res.json({
//     success: true,
//     message: "Backend running",
//     timestamp: new Date().toISOString(),
//   });
// });

// // ==========================================
// // SCRAPE ROUTE
// // ==========================================

// app.post("/api/scrape", async (req, res) => {
//   const {
//     keyword = "frontend developer",
//     location = "United States",
//     skills = "",
//     boards = [
//       "simplyhired",
//       "indeed",
//       "dice",
//       "monster",
//       "glassdoor",
//       "linkedin",
//     ],
//     filters = {},
//     targetPage = 1,
//     boardFilters = {},
//   } = req.body;

//   console.log("===================================");
//   console.log("NEW SCRAPE REQUEST");
//   console.log("Keyword:", keyword);
//   console.log("Location:", location);
//   console.log("Boards:", boards);
//   console.log("===================================");

//   // ==========================================
//   // SSE HEADERS
//   // ==========================================

//   res.writeHead(200, {
//     "Content-Type": "text/event-stream",
//     "Cache-Control": "no-cache, no-transform",
//     Connection: "keep-alive",
//     "X-Accel-Buffering": "no",
//     "Access-Control-Allow-Origin": "*",
//   });

//   res.flushHeaders?.();

//   // Keep connection alive
//   const keepAlive = setInterval(() => {
//     res.write(": keepalive\n\n");
//   }, 15000);

//   const sendEvent = (type, data = {}) => {
//     res.write(
//       `data: ${JSON.stringify({
//         type,
//         ...data,
//       })}\n\n`
//     );
//   };

//   try {
//     jobCache = [];

//     await scrapeJobs({
//       keyword,
//       location,
//       skills,
//       boards,
//       filters,
//       targetPage,
//       boardFilters,

//       onJob: (job) => {
//         jobCache.push(job);
//         sendEvent("job", { job });
//       },

//       onProgress: (message) => {
//         sendEvent("progress", { message });
//       },

//       onError: (board, message) => {
//         sendEvent("error", {
//           board,
//           message,
//         });
//       },

//       onBoardDone: (board) => {
//         sendEvent("board_done", { board });
//       },
//     });

//     sendEvent("done", {
//       total: jobCache.length,
//     });

//   } catch (err) {

//     console.log("SERVER ERROR:", err);

//     sendEvent("error", {
//       board: "global",
//       message: err.message,
//     });

//   } finally {

//     clearInterval(keepAlive);

//     res.end();
//   }
// });

// // ==========================================
// // GET JOBS
// // ==========================================

// app.get("/api/jobs", (req, res) => {
//   res.json({
//     total: jobCache.length,
//     jobs: jobCache,
//   });
// });

// // ==========================================
// // EXPORT JSON
// // ==========================================

// app.get("/api/export/json", (req, res) => {

//   res.setHeader(
//     "Content-Disposition",
//     'attachment; filename="jobs.json"'
//   );

//   res.json(jobCache);
// });

// // ==========================================
// // EXPORT CSV
// // ==========================================

// app.get("/api/export/csv", (req, res) => {

//   if (!jobCache.length) {
//     return res.status(404).json({
//       success: false,
//       message: "No jobs available",
//     });
//   }

//   const headers = [
//     "title",
//     "company",
//     "location",
//     "salary",
//     "jobType",
//     "posted",
//     "board",
//     "matchedSkills",
//     "link",
//     "scrapedAt",
//   ];

//   const escapeCSV = (value) => {

//     if (value === undefined || value === null) {
//       return "";
//     }

//     const str = Array.isArray(value)
//       ? value.join("|")
//       : String(value);

//     return `"${str.replace(/"/g, '""')}"`;
//   };

//   const rows = [
//     headers.join(","),

//     ...jobCache.map((job) =>
//       headers
//         .map((header) => escapeCSV(job[header]))
//         .join(",")
//     ),
//   ];

//   res.setHeader("Content-Type", "text/csv");

//   res.setHeader(
//     "Content-Disposition",
//     'attachment; filename="jobs.csv"'
//   );

//   res.send(rows.join("\n"));
// });

// // ==========================================
// // START SERVER
// // ==========================================

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });




// ======================================================
// JOBHUNT AGGREGATOR — BACKEND SERVER
// ======================================================
// npm install && node server.js
// Runs on http://localhost:4000
// ======================================================

const express     = require("express");
const cors        = require("cors");
const compression = require("compression");
const { scrapeJobs } = require("./scrapers");

const app  = express();
const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Disable compression for SSE
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers.accept === "text/event-stream") return false;
      return compression.filter(req, res);
    },
  })
);

// Prevent Render timeout
app.use((req, res, next) => {
  req.setTimeout(0);
  res.setTimeout(0);
  next();
});

// ─────────────────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────────────────
let jobCache = [];

// ─────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success:   true,
    message:   "Backend running",
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────
// SCRAPE  (SSE)
// POST /api/scrape
//
// Body params:
//   keyword      string   — search term              (default: "frontend developer")
//   location     string   — location string           (default: "United States")
//   skills       string   — comma-separated skills    (default: "")
//   boards       string[] — which boards to scrape    (default: all)
//   filters      object   — datePosted, jobType, remote, sort, salary, experienceLevel
//   targetPage   number   — starting page number      (default: 1)
//   totalPages   number   — how many pages per board  (default: 1)
//   boardFilters object   — per-board filter overrides
// ─────────────────────────────────────────────────────
app.post("/api/scrape", async (req, res) => {
  const {
    keyword      = "frontend developer",
    location     = "United States",
    skills       = "",
    boards       = ["simplyhired", "indeed", "glassdoor", "linkedin"],
    filters      = {},
    targetPage   = 1,
    totalPages   = 1,    // ← NEW: pages 1..totalPages per board
    boardFilters = {},
  } = req.body;

  console.log("===================================");
  console.log("NEW SCRAPE REQUEST");
  console.log("Keyword:     ", keyword);
  console.log("Location:    ", location);
  console.log("Boards:      ", boards);
  console.log("Pages:       ", `${targetPage} → ${targetPage + totalPages - 1} (${totalPages} pages)`);
  console.log("===================================");

  // ── SSE headers ──────────────────────────────────────────────────────────
  res.writeHead(200, {
    "Content-Type":              "text/event-stream",
    "Cache-Control":             "no-cache, no-transform",
    "Connection":                "keep-alive",
    "X-Accel-Buffering":         "no",
    "Access-Control-Allow-Origin": "*",
  });
  res.flushHeaders?.();

  // Keep connection alive every 15s
  const keepAlive = setInterval(() => res.write(": keepalive\n\n"), 15000);

  const sendEvent = (type, data = {}) => {
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
      totalPages,
      boardFilters,

      onJob: (job) => {
        jobCache.push(job);
        sendEvent("job", { job });
      },

      onProgress: (message) => {
        sendEvent("progress", { message });
      },

      onError: (board, message) => {
        sendEvent("error", { board, message });
      },

      onBoardDone: (board) => {
        sendEvent("board_done", { board });
      },
    });

    sendEvent("done", { total: jobCache.length });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    sendEvent("error", { board: "global", message: err.message });
  } finally {
    clearInterval(keepAlive);
    res.end();
  }
});

// ─────────────────────────────────────────────────────
// GET JOBS
// ─────────────────────────────────────────────────────
app.get("/api/jobs", (req, res) => {
  res.json({ total: jobCache.length, jobs: jobCache });
});

// ─────────────────────────────────────────────────────
// EXPORT JSON
// ─────────────────────────────────────────────────────
app.get("/api/export/json", (req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="jobs.json"');
  res.json(jobCache);
});

// ─────────────────────────────────────────────────────
// EXPORT CSV
// ─────────────────────────────────────────────────────
app.get("/api/export/csv", (req, res) => {
  if (!jobCache.length) {
    return res.status(404).json({ success: false, message: "No jobs available" });
  }

  const headers = [
    "title", "company", "location", "salary", "jobType",
    "posted", "board", "matchedSkills", "link", "scrapedAt",
  ];

  const escapeCSV = (value) => {
    if (value === undefined || value === null) return "";
    const str = Array.isArray(value) ? value.join("|") : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = [
    headers.join(","),
    ...jobCache.map((job) =>
      headers.map((h) => escapeCSV(job[h])).join(",")
    ),
  ];

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="jobs.csv"');
  res.send(rows.join("\n"));
});

// ─────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});