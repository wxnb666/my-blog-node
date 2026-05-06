import { Router } from "express";
import { getPool } from "../db.js";

const router = Router({ mergeParams: true });
const pool = getPool();

function toIso(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function sanitizeText(value, max) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const stripped = raw.replace(/[\u0000-\u001F<>]/g, "");
  return stripped.slice(0, max);
}

function rowToClient(row) {
  return {
    id: Number(row.id),
    articleId: row.article_id,
    parentId: row.parent_id != null ? Number(row.parent_id) : null,
    displayName: row.display_name,
    body: row.body,
    isOwnerReply: Boolean(row.is_owner_reply),
    createdAt: toIso(row.created_at),
  };
}

router.get("/", async (req, res, next) => {
  try {
    const articleId = req.params.articleId;
    const [rows] = await pool.query(
      `SELECT id, article_id, parent_id, display_name, body, is_owner_reply, created_at
       FROM comments
       WHERE article_id = ?
       ORDER BY created_at ASC, id ASC`,
      [articleId],
    );
    res.json(rows.map(rowToClient));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const articleId = req.params.articleId;
    const displayName = sanitizeText(req.body?.displayName, 64);
    const body = sanitizeText(req.body?.content ?? req.body?.body, 2000);
    if (!displayName || !body) {
      res.status(400).json({ message: "请填写昵称和评论内容" });
      return;
    }

    const [[article]] = await pool.query("SELECT id FROM articles WHERE id = ? LIMIT 1", [articleId]);
    if (!article) {
      res.status(404).json({ message: "文章不存在" });
      return;
    }

    let parentId = null;
    if (req.body?.parentId != null && req.body.parentId !== "") {
      const n = Number(req.body.parentId);
      if (Number.isFinite(n) && n > 0) {
        const [[parent]] = await pool.query(
          "SELECT id, article_id FROM comments WHERE id = ? LIMIT 1",
          [n],
        );
        if (!parent || parent.article_id !== articleId) {
          res.status(400).json({ message: "回复目标评论不存在" });
          return;
        }
        parentId = n;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO comments (article_id, parent_id, display_name, body, is_owner_reply)
       VALUES (?, ?, ?, ?, 0)`,
      [articleId, parentId, displayName, body],
    );
    const [[row]] = await pool.query("SELECT * FROM comments WHERE id = ? LIMIT 1", [result.insertId]);
    res.status(201).json(rowToClient(row));
  } catch (err) {
    next(err);
  }
});

export default router;
