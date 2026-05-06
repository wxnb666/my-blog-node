import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import articlesRouter from "./routes/articles.js";
import authRouter from "./routes/auth.js";
import topicsRouter from "./routes/topics.js";
import statsRouter from "./routes/stats.js";
import adminRouter from "./routes/admin.js";
import { pingDb } from "./db.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await pingDb();
    res.json({ ok: true, db: "connected" });
  } catch {
    res.status(503).json({ ok: false, db: "disconnected" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/stats", statsRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/articles", articlesRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message ?? "服务器错误" });
});

app.listen(port, () => {
  console.log(`my-blog-node listening on http://127.0.0.1:${port}`);
});
