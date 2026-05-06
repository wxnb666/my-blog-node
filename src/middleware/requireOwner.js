import jwt from "jsonwebtoken";

function jwtSecret() {
  return process.env.JWT_SECRET ?? "dev-blog-jwt-secret-change-me";
}

export function ownerUsername() {
  return process.env.OWNER_USERNAME ?? "xinge";
}

export function requireOwner(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "需要博主登录" });
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, jwtSecret());
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    if (!sub || sub !== ownerUsername()) {
      res.status(403).json({ message: "需要博主权限" });
      return;
    }
    req.owner = { username: sub };
    next();
  } catch {
    res.status(401).json({ message: "登录已过期，请重新登录" });
  }
}

export function signOwnerToken(username) {
  return jwt.sign({ sub: username, typ: "blog" }, jwtSecret(), { expiresIn: "30d" });
}
