import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const articleSeeds = [
  {
    id: "react-blog-admin",
    title: "从零搭建 React 博客后台",
    desc: "记录 Vite、Router、Redux 与 Ant Design 的基础组合，让项目结构更清晰。",
    tag: "React",
    date_label: "05/06",
    author: "鑫哥",
    content:
      "<p>这篇文章记录鑫哥的博客从基础环境到页面路由的搭建过程，方便后续继续接入后台管理和接口数据。</p>",
  },
  {
    id: "frontend-engineering",
    title: "前端工程化里的那些小细节",
    desc: "聊聊路径别名、目录拆分、构建优化和日常开发体验的取舍。",
    tag: "工程化",
    date_label: "04/28",
    author: "鑫哥",
    content:
      "<p>路径别名、组件拆分和构建优化都会影响项目长期维护体验，先把基础约定搭好会省下很多沟通成本。</p>",
  },
  {
    id: "growth-list",
    title: "写给自己的技术成长清单",
    desc: "把学习节奏、项目复盘和问题记录沉淀成持续更新的博客内容。",
    tag: "随笔",
    date_label: "04/16",
    author: "鑫哥",
    content:
      "<p>成长不是一次性完成的事情，把每一次踩坑和复盘写下来，就是博客最有价值的部分。</p>",
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "blog",
    multipleStatements: true,
  });

  const schema = readFileSync(path.join(root, "database", "schema.sql"), "utf8");
  await conn.query(schema);

  for (const a of articleSeeds) {
    await conn.query(
      `INSERT INTO articles (id, title, \`desc\`, tag, date_label, author, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         \`desc\` = VALUES(\`desc\`),
         tag = VALUES(tag),
         date_label = VALUES(date_label),
         author = VALUES(author),
         content = VALUES(content)`,
      [a.id, a.title, a.desc, a.tag, a.date_label, a.author, a.content],
    );
  }

  const password = process.env.SEED_ADMIN_PASSWORD ?? "123456";
  const hash = await bcrypt.hash(password, 10);
  await conn.query(
    `INSERT INTO users (username, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ["xinge", hash],
  );

  console.log(
    "Seed 完成：articles 3 条（可重复执行），用户 xinge 密码为环境变量 SEED_ADMIN_PASSWORD 或默认 123456",
  );
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
