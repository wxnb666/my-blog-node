import { Router } from "express";
import { getPool } from "../db.js";

const router = Router();
const pool = getPool();

function rowToClient(row) {
  return {
    id: row.id,
    title: row.title,
    desc: row.desc,
    tag: row.tag,
    date: row.date_label,
    author: row.author,
    content: row.content,
  };
}

/** GET /api/articles?limit= */
router.get("/", async (req, res, next) => {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : null;
    const sql =
      limit && Number.isFinite(limit) && limit > 0
        ? "SELECT * FROM articles ORDER BY created_at DESC LIMIT ?"
        : "SELECT * FROM articles ORDER BY created_at DESC";
    const [rows] =
      limit && Number.isFinite(limit) && limit > 0
        ? await pool.query(sql, [limit])
        : await pool.query(sql);
    res.json(rows.map(rowToClient));
  } catch (err) {
    next(err);
  }
});

/** GET /api/articles/:id */
router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM articles WHERE id = ? LIMIT 1", [
      req.params.id,
    ]);
    if (!rows.length) {
      res.status(404).json({ message: "文章不存在" });
      return;
    }
    res.json(rowToClient(rows[0]));
  } catch (err) {
    next(err);
  }
});

/** POST /api/articles */
router.post("/", async (req, res, next) => {
  try {
    const { title, desc, tag, content, author } = req.body ?? {};
    if (!title || !tag || !content) {
      res.status(400).json({ message: "缺少 title、tag 或 content" });
      return;
    }
    const id = `article-${Date.now()}`;
    const dateLabel = new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const authorName = typeof author === "string" && author.trim() ? author.trim() : "鑫哥";
    await pool.query(
      "INSERT INTO articles (id, title, `desc`, tag, date_label, author, content) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, title, desc ?? "", tag, dateLabel, authorName, content],
    );
    const [rows] = await pool.query("SELECT * FROM articles WHERE id = ? LIMIT 1", [id]);
    res.status(201).json(rowToClient(rows[0]));
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/articles/:id — 管理用 */
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM articles WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: "文章不存在" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
