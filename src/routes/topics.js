import { Router } from "express";
import { getPool } from "../db.js";

const router = Router();
const pool = getPool();

function toIso(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function rowToClient(row) {
  return {
    id: row.id,
    title: row.title,
    desc: row.desc,
    tag: row.topic_name || row.tag,
    topicSlug: row.topic_slug ?? null,
    topicName: row.topic_name ?? null,
    date: row.date_label,
    author: row.author,
    content: row.content,
    viewCount: Number(row.view_count ?? 0),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.slug, t.name, COUNT(a.id) AS article_count
       FROM topics t
       LEFT JOIN articles a ON a.topic_id = t.id
       GROUP BY t.id, t.slug, t.name
       ORDER BY t.id ASC`,
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        articleCount: Number(r.article_count ?? 0),
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/:slug/articles", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const [rows] = await pool.query(
      `SELECT a.*, t.slug AS topic_slug, t.name AS topic_name
       FROM articles a
       INNER JOIN topics t ON t.id = a.topic_id
       WHERE t.slug = ?
       ORDER BY a.created_at DESC`,
      [slug],
    );
    res.json(rows.map(rowToClient));
  } catch (err) {
    next(err);
  }
});

export default router;
