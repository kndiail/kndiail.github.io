/**
 * Chapter Navigation Helper
 *
 * Parses the chapter number from post titles matching「第NN章」and
 * provides prev/next navigation + a full chapter list, sorted
 * numerically (independent of post dates).
 *
 * Usage in templates:
 *   const nav = getChapterNav(page);   // or getChapterNav(post)
 *   nav => { index, total, prev, next, list } | null
 */

const RE = /第(\d+)章/;

function chapterNum(title) {
  if (!title) return NaN;
  const m = RE.exec(String(title));
  return m ? parseInt(m[1], 10) : NaN;
}

hexo.extend.helper.register("getChapterNav", function (post) {
  const n = chapterNum(post && post.title);
  if (isNaN(n)) return null;

  // Collect all posts with a chapter number, sorted numerically.
  // Guard against missing site/posts in some render contexts.
  const allPosts = this.site && this.site.posts ? this.site.posts.toArray() : [];
  const posts = allPosts.filter((p) => !isNaN(chapterNum(p.title)));
  posts.sort((a, b) => chapterNum(a.title) - chapterNum(b.title));

  const idx = posts.findIndex((p) => p.title === post.title);
  if (idx < 0) return null;

  return {
    index: idx + 1,
    total: posts.length,
    prev: idx > 0 ? posts[idx - 1] : null,
    next: idx < posts.length - 1 ? posts[idx + 1] : null,
    list: posts.map((p) => ({
      title: p.title,
      path: p.path,
      num: chapterNum(p.title),
      current: p.title === post.title,
    })),
  };
});
