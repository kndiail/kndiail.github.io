/**
 * Legacy URL redirects (旧链接防 404).
 *
 * 文章 URL 已从 /:year/:month/:day/<中文文件名>/（百分号编码、又长又丑）
 * 迁移到短编号 permalink（如 /posts/bczj-27/）。
 *
 * 本生成器为每个旧路径发布一个极小的跳转页（meta refresh + canonical +
 * JS location.replace + 可见链接），让旧链接、书签、搜索引擎收录继续可用，
 * 并附带 noindex 避免跳转页本身被收录。
 *
 * 同时对仍未指定 permalink、URL 中含非 ASCII 字符的文章在构建时给出警告。
 */
"use strict";

const path = require("path");

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, "&")
		.replace(/</g, "<")
		.replace(/>/g, ">")
		.replace(/"/g, """);
}

hexo.extend.generator.register("legacy_post_redirects", function (locals) {
	const routes = [];
	locals.posts.sort("date").each((post) => {
		try {
			const name = post.source.replace(/^.*[\\/]/, "").replace(/\.md$/i, "");
			const target = path.join(post.__permalink || "", "index.html").replace(/\\/g, "/");
			const d = post.date;
			const pad = (n) => String(n).padStart(2, "0");
			const oldPath = `${d.format("YYYY")}/${pad(d.month() + 1)}/${pad(d.date())}/${name}/index.html`;
			// 文章 URL 未迁移（permalink 与旧规则一致）时无需跳转
			if (target === `${name}/index.html`) return;
			routes.push({
				path: oldPath,
				data: redirectHtml(target, post.title),
			});
			// URL 中仍有非 ASCII 字符（例如未来文章忘了写 permalink）时提醒
			if (/[^\x00-\x7F]/.test(target)) {
				hexo.log.warn(`文章 URL 含非 ASCII 字符，建议在 front-matter 指定 permalink: ${target} (${post.source})`);
			}
		} catch (e) {
			hexo.log.error("legacy-redirect: " + (e && e.message ? e.message : e));
		}
	});
	return routes;
});

function redirectHtml(target, title) {
	const t = escapeHtml(target);
	const tt = escapeHtml(title);
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>${tt} · 已更换地址</title>
<meta http-equiv="refresh" content="0; url=${t}">
<link rel="canonical" href="${t}">
</head>
<body>
<p>本文已更换地址，正在前往 <a href="${t}">${t}</a>…</p>
<script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`;
}
