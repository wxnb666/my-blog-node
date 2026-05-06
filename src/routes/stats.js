import { Router } from "express";
import { getPool } from "../db.js";

const router = Router();
const pool = getPool();

router.get("/", async (_req, res, next) => {
  try {
    const [[stats]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM articles) AS article_count,
         (SELECT COUNT(*) FROM topics) AS topic_count,
         (SELECT COALESCE(SUM(view_count), 0) FROM articles) AS total_views`,
    );
    res.json({
      articleCount: Number(stats.article_count ?? 0),
      topicCount: Number(stats.topic_count ?? 0),
      totalViews: Number(stats.total_views ?? 0),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
