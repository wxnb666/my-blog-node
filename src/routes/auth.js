import { Router } from "express";
import bcrypt from "bcrypt";
import { getPool } from "../db.js";
import { ownerUsername, signOwnerToken } from "../middleware/requireOwner.js";

const router = Router();
const pool = getPool();

router.post("/login", async (req, res, next) => {
  try {
    const account = typeof req.body?.account === "string" ? req.body.account.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!account || !password) {
      res.status(400).json({ message: "请输入账号和密码" });
      return;
    }

    const [rows] = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1",
      [account],
    );
    if (!rows.length) {
      res.status(401).json({ message: "账号或密码不正确" });
      return;
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      res.status(401).json({ message: "账号或密码不正确" });
      return;
    }

    const ownerName = ownerUsername();
    const role = user.username === ownerName ? "owner" : "reader";
    const token = signOwnerToken(user.username);

    res.json({
      user: { id: user.id, username: user.username, role },
      token,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
