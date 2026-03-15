const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", (_req, res) => {
  res.status(503).json({ error: "API not configured - database required" });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
