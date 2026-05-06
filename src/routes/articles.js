import { Router } from "express";
import { getPool } from "../db.js";
import { requireOwner } from "../middleware/requireOwner.js";
import articleCommentsRouter from "./articleComments.js";

const router = Router();
const pool = getPool();

const TAG_TO_SLUG = {
  React: "react",
  Redux: "redux",
  工程化: "frontend-engineering",
  前端工程化: "frontend-engineering",
  随笔: "life-notes",
  生活随笔: "life-notes",
  "Ant Design": "ant-design",
};

const BASE_JOIN = "FROM articles a LEFT JOIN topics t ON a.topic_id = t.id";

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

async function resolveTopicMeta(tag) {
  const slug = TAG_TO_SLUG[tag];
  if (!slug) {
    throw Object.assign(new Error("无效的文章分类"), { statusCode: 400 });
  }
  const [rows] = await pool.query("SELECT id, name FROM topics WHERE slug = ? LIMIT 1", [slug]);
  if (!rows.length) {
    throw Object.assign(new Error("专题不存在"), { statusCode: 400 });
  }
  return { topicId: rows[0].id, topicName: rows[0].name };
}

router.post("/:id/view", async (req, res, next) => {
  try {
    const [result] = await pool.query("UPDATE articles SET view_count = view_count + 1 WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: "文章不存在" });
      return;
    }
    const [rows] = await pool.query("SELECT view_count FROM articles WHERE id = ? LIMIT 1", [
      req.params.id,
    ]);
    res.json({ viewCount: Number(rows[0].view_count) });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : null;
    const topicSlug = typeof req.query.topicSlug === "string" ? req.query.topicSlug.trim() : "";
    let sql = `SELECT a.*, t.slug AS topic_slug, t.name AS topic_name ${BASE_JOIN}`;
    const params = [];
    if (topicSlug) {
      sql += " WHERE t.slug = ?";
      params.push(topicSlug);
    }
    sql += " ORDER BY a.created_at DESC";
    if (limit && Number.isFinite(limit) && limit > 0) {
      sql += " LIMIT ?";
      params.push(limit);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(rowToClient));
  } catch (err) {
    next(err);
  }
});

router.use("/:articleId/comments", articleCommentsRouter);

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, t.slug AS topic_slug, t.name AS topic_name ${BASE_JOIN} WHERE a.id = ? LIMIT 1`,
      [req.params.id],
    );
    if (!rows.length) {
      res.status(404).json({ message: "文章不存在" });
      return;
    }
    res.json(rowToClient(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireOwner, async (req, res, next) => {
  try {
    const { title, desc, tag, content, author } = req.body ?? {};
    if (!title || !tag || !content) {
      res.status(400).json({ message: "缺少 title、tag 或 content" });
      return;
    }
    const { topicId, topicName } = await resolveTopicMeta(tag);
    const id = `article-${Date.now()}`;
    const dateLabel = new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const authorName = typeof author === "string" && author.trim() ? author.trim() : "鑫哥";
    await pool.query(
      "INSERT INTO articles (id, title, `desc`, tag, topic_id, date_label, author, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, title, desc ?? "", topicName, topicId, dateLabel, authorName, content],
    );
    const [rows] = await pool.query(
      `SELECT a.*, t.slug AS topic_slug, t.name AS topic_name ${BASE_JOIN} WHERE a.id = ? LIMIT 1`,
      [id],
    );
    res.status(201).json(rowToClient(rows[0]));
  } catch (err) {
    if (err.statusCode === 400) {
      res.status(400).json({ message: err.message });
      return;
    }
    next(err);
  }
});

router.delete("/:id", requireOwner, async (req, res, next) => {
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
