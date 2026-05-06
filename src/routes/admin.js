import { Router } from "express";
import { getPool } from "../db.js";
import { requireOwner } from "../middleware/requireOwner.js";

const router = Router();
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
    articleTitle: row.article_title,
    parentId: row.parent_id != null ? Number(row.parent_id) : null,
    displayName: row.display_name,
    body: row.body,
    isOwnerReply: Boolean(row.is_owner_reply),
    createdAt: toIso(row.created_at),
  };
}

router.get("/comments", requireOwner, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.article_id, c.parent_id, c.display_name, c.body, c.is_owner_reply, c.created_at,
              a.title AS article_title
       FROM comments c
       INNER JOIN articles a ON a.id = c.article_id
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT 500`,
    );
    res.json(rows.map(rowToClient));
  } catch (err) {
    next(err);
  }
});

router.post("/comments/:commentId/reply", requireOwner, async (req, res, next) => {
  try {
    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId)) {
      res.status(400).json({ message: "评论 ID 无效" });
      return;
    }
    const body = sanitizeText(req.body?.content ?? req.body?.body, 2000);
    if (!body) {
      res.status(400).json({ message: "请输入回复内容" });
      return;
    }

    const [[parent]] = await pool.query("SELECT * FROM comments WHERE id = ? LIMIT 1", [commentId]);
    if (!parent) {
      res.status(404).json({ message: "评论不存在" });
      return;
    }

    const displayName =
      sanitizeText(process.env.OWNER_REPLY_DISPLAY_NAME ?? "", 64) || "鑫哥（博主）";

    const [result] = await pool.query(
      `INSERT INTO comments (article_id, parent_id, display_name, body, is_owner_reply)
       VALUES (?, ?, ?, ?, 1)`,
      [parent.article_id, parent.id, displayName, body],
    );
    const [[row]] = await pool.query(
      `SELECT c.id, c.article_id, c.parent_id, c.display_name, c.body, c.is_owner_reply, c.created_at,
              a.title AS article_title
       FROM comments c
       INNER JOIN articles a ON a.id = c.article_id
       WHERE c.id = ?
       LIMIT 1`,
      [result.insertId],
    );
    res.status(201).json(rowToClient(row));
  } catch (err) {
    next(err);
  }
});

export default router;
