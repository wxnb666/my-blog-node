import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const TOPICS = [
  { slug: "react", name: "React" },
  { slug: "redux", name: "Redux" },
  { slug: "ant-design", name: "Ant Design" },
  { slug: "frontend-engineering", name: "前端工程化" },
  { slug: "life-notes", name: "生活随笔" },
];

const ARTICLE_SEEDS = [
  {
    id: "react-blog-admin",
    title: "从零搭建 React 博客后台",
    desc:
      "面向个人站与小型内容场景的实践笔记：拆解 Vite 工程骨架、路由与布局分层、Redux 状态边界，以及 Ant Design 在后台型界面中的组合方式，并给出可复制的目录约定与接口接入策略。",
    topicSlug: "react",
    date_label: "05/06",
    author: "鑫哥",
    content: `
<h2>1. 目标与边界</h2>
<p>这篇长文用于沉淀一次「博客前台 + 简易后台心智」的搭建过程：我们优先保证<strong>可维护的目录结构</strong>、<strong>清晰的路由分层</strong>，以及<strong>可替换的数据层</strong>（从本地 mock 平滑迁移到 REST）。</p>
<blockquote>建议把博客当作产品：先定义信息架构（列表 / 详情 / 写作 / 登录），再选技术栈，而不是反过来。</blockquote>
<h2>2. 工程骨架（Vite + React）</h2>
<p>推荐使用 <code>src/pages</code> 承载页面级入口，<code>src/components</code> 只放可复用块，<code>src/api</code> 收敛请求封装。这样当文章数量上升时，你不会在「巨型 App」里迷路。</p>
<ul>
  <li><strong>路径别名</strong>：统一 <code>@/</code> 指向 <code>src</code>，减少相对路径噪音。</li>
  <li><strong>环境变量</strong>：生产与开发 API 地址分离，避免上线后批量替换。</li>
  <li><strong>代码分割</strong>：编辑器与富文本依赖较重时，优先路由级 lazy。</li>
</ul>
<h2>3. 路由与布局</h2>
<p>登录页与内容站可使用不同布局：登录强调聚焦与品牌，内容站强调导航与阅读动线。使用嵌套路由或 layout 组件，把「壳」与「页」拆开，后续加专题、标签、搜索都更轻松。</p>
<h2>4. 状态管理（Redux）放什么？</h2>
<p>博客场景里，Redux 更适合承载<strong>跨页面共享且变化不频繁</strong>的状态（例如用户信息、主题偏好）。文章列表与详情优先使用服务端数据源 + 组件本地状态，避免把「服务器事实」复制进全局 store 造成同步成本。</p>
<h2>5. Ant Design 的实践建议</h2>
<p>把表单、表格、反馈组件当作「生产力工具」，但要控制样式侵入：通过 ConfigProvider 统一主题 token，页面级再用局部样式覆盖。对于写作页，建议将富文本与表单字段解耦，便于替换编辑器实现。</p>
<h2>6. 接入后端接口的检查清单</h2>
<ol>
  <li>统一错误模型（message / code），前端只解析一层。</li>
  <li>列表与详情字段对齐，避免同一概念多个命名。</li>
  <li>分页、筛选、阅读量等「统计类字段」要有明确更新时机。</li>
</ol>
<p>当你完成以上约定，博客项目会从 demo 过渡到「可长期迭代的产品骨架」。下一步可以按专题组织内容，并补齐鉴权与审计日志。</p>
`.trim(),
  },
  {
    id: "frontend-engineering",
    title: "前端工程化里的那些小细节",
    desc:
      "从路径别名、目录边界、构建与缓存、团队协作约定四个维度，整理工程化里最容易被忽视但对维护成本影响最大的细节，并给出可执行的落地清单。",
    topicSlug: "frontend-engineering",
    date_label: "04/28",
    author: "鑫哥",
    content: `
<h2>1. 为什么「小细节」会吃掉大效率</h2>
<p>工程化的目标不是堆工具，而是<strong>降低协作摩擦</strong>与<strong>降低变更成本</strong>。很多时候拖慢团队的并不是框架，而是命名、目录、构建与约定不一致导致的隐性沟通。</p>
<h2>2. 路径与模块边界</h2>
<p>路径别名解决可读性，但也会隐藏依赖方向。建议约定：<strong>页面可以引用组件与 api；组件禁止引用页面</strong>；公共工具放在 <code>src/lib</code>，避免到处 <code>../../..</code>。</p>
<ul>
  <li>为「领域模块」建立边界：例如 <code>articles</code>、<code>auth</code>，避免交叉引用形成网状依赖。</li>
  <li>对跨模块复用保持克制：复用前先问「这是 UI 复用还是业务复用？」</li>
</ul>
<h2>3. 构建与性能：别只盯着包体积</h2>
<p>除了 bundle size，更要关注<strong>缓存命中率</strong>与<strong>增量构建</strong>体验。将第三方依赖与业务代码拆分，配合稳定的 lockfile，能显著减少「我本地能跑」问题。</p>
<blockquote>工程化的底线是：新同事按 README 能在 30 分钟内跑起来主流程。</blockquote>
<h2>4. 代码风格与评审</h2>
<p>ESLint/Prettier 解决格式问题，但无法解决设计问题。建议在 PR 模板里固定三类问题：是否引入隐式全局状态？是否破坏模块边界？是否补齐关键路径的报错信息？</p>
<h2>5. 一份可执行的落地清单</h2>
<ol>
  <li>统一 Node 版本与包管理器（npm/pnpm）并在 CI 校验。</li>
  <li>关键脚本：<code>lint</code>、<code>test</code>、<code>build</code> 必须在 CI 全绿。</li>
  <li>为「接口类型」建立单一事实来源（OpenAPI/手写 types），避免复制粘贴 drift。</li>
</ol>
<p>当你把上述细节固化成团队习惯，工程化才会从口号变成真正的加速度。</p>
`.trim(),
  },
  {
    id: "growth-list",
    title: "写给自己的技术成长清单",
    desc:
      "用一份可持续更新的清单管理学习目标：把输入、输出、复盘与项目实践串成闭环，让博客成为证据链，而不是情绪记录。",
    topicSlug: "life-notes",
    date_label: "04/16",
    author: "鑫哥",
    content: `
<h2>1. 清单的目的：对抗遗忘与焦虑</h2>
<p>技术成长最常见的损耗，是把「看过」当成「掌握」。清单的意义在于把学习变成<strong>可追踪的交付</strong>：每周至少一次可展示的输出（笔记、demo、MR、文章）。</p>
<h2>2. 四个象限：输入 / 实践 / 复盘 / 传播</h2>
<ul>
  <li><strong>输入</strong>：课程、文档、源码阅读；要有问题意识，带着问题读。</li>
  <li><strong>实践</strong>：最小可运行示例优先，先跑通再抽象。</li>
  <li><strong>复盘</strong>：记录决策原因、替代方案、踩坑与结论。</li>
  <li><strong>传播</strong>：博客、内部分享、代码评审评论，把隐性经验显性化。</li>
</ul>
<h2>3. 博客如何服务成长</h2>
<p>把博客当作作品集与知识库：文章要有结构（背景—方案—结果—反思），并尽量链接到代码与数据。长期看，文章比碎片收藏更能证明你的成长曲线。</p>
<blockquote>写作是最便宜的「自我审计」：写不清楚通常意味着没真懂。</blockquote>
<h2>4. 清单模板（可直接复制）</h2>
<ol>
  <li>本月主题：________（只选一个主战场）</li>
  <li>本周交付：________（可运行 / 可阅读 / 可讲解）</li>
  <li>阻塞项：________（需要谁 / 需要什么资源）</li>
  <li>下月回顾：用一篇博客总结「做对了什么 / 会怎么改」</li>
</ol>
<p>成长不是冲刺，而是把正确的事情重复足够多次。愿这份清单帮你把努力变成可见的积累。</p>
`.trim(),
  },
];

async function ensureTopicsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      slug VARCHAR(64) NOT NULL,
      name VARCHAR(128) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_topics_slug (slug),
      UNIQUE KEY uk_topics_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function ensureArticleColumns(conn) {
  const alters = [
    "ALTER TABLE articles ADD COLUMN topic_id INT UNSIGNED NULL",
    "ALTER TABLE articles ADD COLUMN view_count INT UNSIGNED NOT NULL DEFAULT 0",
  ];
  for (const sql of alters) {
    try {
      await conn.query(sql);
    } catch (e) {
      if (e.code !== "ER_DUP_FIELDNAME") throw e;
    }
  }

  try {
    await conn.query(`
      ALTER TABLE articles
      ADD CONSTRAINT fk_articles_topic
      FOREIGN KEY (topic_id) REFERENCES topics(id)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  } catch (e) {
    if (e.code !== "ER_DUP_KEYNAME" && e.errno !== 1826) throw e;
  }

  try {
    await conn.query("CREATE INDEX idx_topic_id ON articles (topic_id)");
  } catch (e) {
    if (e.code !== "ER_DUP_KEYNAME") throw e;
  }
}

async function upsertTopics(conn) {
  for (const t of TOPICS) {
    await conn.query(
      `INSERT INTO topics (slug, name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [t.slug, t.name],
    );
  }
}

async function upsertArticles(conn) {
  for (const a of ARTICLE_SEEDS) {
    const [[topic]] = await conn.query("SELECT id, name FROM topics WHERE slug = ? LIMIT 1", [
      a.topicSlug,
    ]);
    if (!topic) throw new Error(`missing topic ${a.topicSlug}`);
    await conn.query(
      `INSERT INTO articles (id, title, \`desc\`, tag, topic_id, date_label, author, content, view_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         \`desc\` = VALUES(\`desc\`),
         tag = VALUES(tag),
         topic_id = VALUES(topic_id),
         date_label = VALUES(date_label),
         author = VALUES(author),
         content = VALUES(content)`,
      [a.id, a.title, a.desc, topic.name, topic.id, a.date_label, a.author, a.content],
    );
  }
}

async function migrateLegacyArticles(conn) {
  await conn.query(`
    UPDATE articles a
    INNER JOIN topics t ON t.slug = 'react'
    SET a.topic_id = t.id, a.tag = t.name
    WHERE a.id = 'react-blog-admin' AND (a.topic_id IS NULL OR a.topic_id = 0)
  `);
  await conn.query(`
    UPDATE articles a
    INNER JOIN topics t ON t.slug = 'frontend-engineering'
    SET a.topic_id = t.id, a.tag = t.name
    WHERE a.id = 'frontend-engineering' AND (a.topic_id IS NULL OR a.topic_id = 0)
  `);
  await conn.query(`
    UPDATE articles a
    INNER JOIN topics t ON t.slug = 'life-notes'
    SET a.topic_id = t.id, a.tag = t.name
    WHERE a.id = 'growth-list' AND (a.topic_id IS NULL OR a.topic_id = 0)
  `);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "blog",
    multipleStatements: true,
  });

  const schemaPath = path.join(root, "database", "schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  await conn.query(schema);

  await ensureTopicsTable(conn);
  await ensureArticleColumns(conn);
  await upsertTopics(conn);
  await upsertArticles(conn);
  await migrateLegacyArticles(conn);

  const password = process.env.SEED_ADMIN_PASSWORD ?? "123456";
  const hash = await bcrypt.hash(password, 10);
  await conn.query(
    `INSERT INTO users (username, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ["xinge", hash],
  );

  console.log(
    "Seed OK: topics + articles; login xinge / SEED_ADMIN_PASSWORD or default 123456",
  );
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
