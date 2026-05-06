INSERT INTO `articles` (`id`, `title`, `desc`, `tag`, `date_label`, `author`, `content`) VALUES
('react-blog-admin', '从零搭建 React 博客后台', '记录 Vite、Router、Redux 与 Ant Design 的基础组合，让项目结构更清晰。', 'React', '05/06', '鑫哥', '<p>这篇文章记录鑫哥的博客从基础环境到页面路由的搭建过程，方便后续继续接入后台管理和接口数据。</p>'),
('frontend-engineering', '前端工程化里的那些小细节', '聊聊路径别名、目录拆分、构建优化和日常开发体验的取舍。', '工程化', '04/28', '鑫哥', '<p>路径别名、组件拆分和构建优化都会影响项目长期维护体验，先把基础约定搭好会省下很多沟通成本。</p>'),
('growth-list', '写给自己的技术成长清单', '把学习节奏、项目复盘和问题记录沉淀成持续更新的博客内容。', '随笔', '04/16', '鑫哥', '<p>成长不是一次性完成的事情，把每一次踩坑和复盘写下来，就是博客最有价值的部分。</p>')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  `desc` = VALUES(`desc`),
  tag = VALUES(tag),
  date_label = VALUES(date_label),
  author = VALUES(author),
  content = VALUES(content);

INSERT INTO `users` (`username`, `password_hash`) VALUES
('xinge', '$2b$10$MKc9ioxZwFZz8gjylD0us.tegEyDAHH9H1kCp8xD8i3ir0gQ/M9ku')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`);