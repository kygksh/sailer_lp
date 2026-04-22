const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BLOG_SRC = path.join(ROOT, "blog", "ja");
const BLOG_DEST = path.join(ROOT, "ja", "blog");
const BLOG_INDEX = path.join(ROOT, "ja", "blog.html");

// --- Markdown parsing ---

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Invalid frontmatter");
  const meta = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: match[2].trim() };
}

function markdownToHtml(md) {
  // Split into paragraphs by blank lines
  const blocks = md.split(/\n\n+/);
  return blocks
    .map((block) => {
      // Image block with optional caption:
      // ![alt](filename)
      // **caption title**
      // caption description
      const imgMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\n([\s\S]*))?$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2].startsWith("http")
          ? imgMatch[2]
          : `../../images/blog/${imgMatch[2]}`;
        let caption = "";
        if (imgMatch[3]) {
          const captionHtml = imgMatch[3]
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br />");
          caption = `\n          <figcaption class="blog-caption">${captionHtml}</figcaption>`;
        }
        const isVideo = /\.(mp4|webm|mov)$/i.test(imgMatch[2]);
        const media = isVideo
          ? `<video src="${src}" autoplay loop muted playsinline></video>`
          : `<img src="${src}" alt="${alt}" />`;
        return `        <figure class="blog-figure">\n          ${media}${caption}\n        </figure>`;
      }
      // Convert inline markdown: links (must come before image to avoid conflict)
      let html = block
        .replace(
          /!\[([^\]]*)\]\(([^)]+)\)/g,
          (_, alt, file) => {
            const src = file.startsWith("http") ? file : `../../images/blog/${file}`;
            return `<img src="${src}" alt="${alt}" class="blog-inline-image" />`;
          }
        )
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener">$1</a>'
        )
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      return `        <p>\n          ${html}\n        </p>`;
    })
    .join("\n\n");
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${Number(y)}年${Number(m)}月${Number(d)}日`;
}

// --- Templates ---

function articleTemplate(meta, bodyHtml) {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sailer - ${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image" content="${meta.og_image ? `https://sailer.shudev.app/images/blog/${meta.og_image}` : 'https://sailer.shudev.app/images/ja/og-image.png'}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="https://sailer.shudev.app/ja/blog/${meta.slug}.html" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:site_name" content="Sailer" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="https://sailer.shudev.app/ja/blog/${meta.slug}.html" />
    <link rel="icon" type="image/png" href="/images/favicon-40x40.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.webp" />
    <link rel="stylesheet" href="../../style.css" />
  </head>
  <body>
    <!-- Nav -->
    <nav class="nav">
      <div class="nav-inner">
        <a href="../index.html" class="nav-logo">
          <img
            src="../../images/nav-icon.png"
            srcset="../../images/nav-icon.png 1x, ../../images/nav-icon@2x.png 2x, ../../images/nav-icon@3x.png 3x"
            alt="Sailer"
            class="nav-icon"
          />
          Sailer: 音声プレーヤー
        </a>
        <div class="nav-links">
          <a href="../support.html" class="nav-link">サポート</a>
          <a href="../blog.html" class="nav-link">ブログ</a>
        </div>
        <a
          class="nav-cta"
          href="https://apps.apple.com/jp/app/sailer-音声ファイル再生/id6756638375"
          target="_blank"
          rel="noopener"
        >
          ダウンロード
        </a>
        <button
          class="nav-toggle"
          aria-label="メニューを開く"
          aria-expanded="false"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      <div class="nav-menu">
        <a href="../support.html" class="nav-menu-link">サポート</a>
        <a href="../blog.html" class="nav-menu-link">ブログ</a>
        <a
          class="nav-menu-link"
          href="https://apps.apple.com/jp/app/sailer-音声ファイル再生/id6756638375"
          target="_blank"
          rel="noopener"
        >
          ダウンロード
        </a>
      </div>
    </nav>
    <script src="../../js/nav.js"></script>

    <!-- Article -->
    <main class="blog-article">
      <div class="blog-hero">
        ${meta.image ? `<img src="../../images/blog/${meta.image}" alt="${meta.title}" class="blog-hero-image" />` : '<div class="blog-hero-placeholder"></div>'}
      </div>
      <div class="blog-article-inner">
        <p class="blog-date">${formatDate(meta.date)}</p>
        <h1 class="blog-article-title">${meta.title}</h1>

${bodyHtml}
        <div class="blog-share">
          <div class="blog-share-buttons">
            <a href="https://twitter.com/intent/tweet?url=https://sailer.shudev.app/ja/blog/${meta.slug}.html&text=${encodeURIComponent(meta.title)}" target="_blank" rel="noopener" class="blog-share-btn blog-share-x" aria-label="Xでシェア">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=https://sailer.shudev.app/ja/blog/${meta.slug}.html" target="_blank" rel="noopener" class="blog-share-btn blog-share-fb" aria-label="Facebookでシェア">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://social-plugins.line.me/lineit/share?url=https://sailer.shudev.app/ja/blog/${meta.slug}.html" target="_blank" rel="noopener" class="blog-share-btn blog-share-line" aria-label="LINEでシェア">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            </a>
            <a href="https://b.hatena.ne.jp/entry/s/sailer.shudev.app/ja/blog/${meta.slug}.html" target="_blank" rel="noopener" class="blog-share-btn blog-share-hatena" aria-label="はてなブックマーク">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.47 0C22.42 0 24 1.58 24 3.53v16.94c0 1.95-1.58 3.53-3.53 3.53H3.53C1.58 24 0 22.42 0 20.47V3.53C0 1.58 1.58 0 3.53 0h16.94zm-4.39 13.4c-.7 0-1.26.56-1.26 1.26s.56 1.27 1.26 1.27 1.27-.57 1.27-1.27-.57-1.26-1.27-1.26zm-1.18-7.27h-2.05v9.74h2.05c0-.01 0-9.74 0-9.74zm-3.6 4.87c0-1.09-.36-1.89-1.13-2.42-.77-.53-1.7-.53-2.42-.53H4.43v9.74h3.26c.85 0 1.56-.12 2.31-.59.94-.59 1.3-1.48 1.3-2.59 0-1.3-.52-2.19-1.53-2.65.7-.42 1.53-1.04 1.53-1.96zm-2.59-.24c0 .76-.47 1.35-1.3 1.35H6.44V8.82h1.94c.83 0 1.33.47 1.33 1.18v.76zm.47 4.24c0 .94-.59 1.53-1.53 1.53H6.44v-3.06h1.77c.94 0 1.41.59 1.41 1.53z"/></svg>
            </a>
          </div>
        </div>
        <p class="blog-article-crumb"><a href="../blog.html">&larr; ブログ一覧に戻る</a></p>
      </div>
    </main>
    <script src="../../js/lightbox.js"></script>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-copy">
          &copy; 2026 Shu Kyogoku. All rights reserved.
        </div>
        <div class="footer-links">
          <a href="../privacypolicy.html">プライバシーポリシー</a>
        </div>
      </div>
    </footer>
  </body>
</html>
`;
}

function blogIndexTemplate(articles) {
  const listItems = articles
    .map(
      (a) => `          <li>
            <a href="blog/${a.meta.slug}.html">
              <div class="blog-list-text">
                <span class="blog-list-title">${a.meta.title}</span>
                <span class="blog-list-meta">${formatDate(a.meta.date)}</span>
              </div>
              ${a.meta.image ? `<img src="../images/blog/${a.meta.image}" alt="" class="blog-list-thumb" />` : '<div class="blog-list-thumb"></div>'}
            </a>
          </li>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sailer - ブログ</title>
    <meta name="description" content="Sailerの開発ブログ。語学学習と音声プレーヤーに関する記事を発信します。" />
    <meta property="og:title" content="Sailer - ブログ" />
    <meta property="og:description" content="Sailerの開発ブログ。語学学習と音声プレーヤーに関する記事を発信します。" />
    <meta property="og:image" content="https://sailer.shudev.app/images/ja/og-image.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="https://sailer.shudev.app/ja/blog.html" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:site_name" content="Sailer" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="https://sailer.shudev.app/ja/blog.html" />
    <link rel="icon" type="image/png" href="/images/favicon-40x40.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.webp" />
    <link rel="alternate" hreflang="ja" href="blog.html" />
    <link rel="alternate" hreflang="en" href="../en/blog.html" />
    <link rel="alternate" hreflang="x-default" href="../en/blog.html" />
    <link rel="stylesheet" href="../style.css" />
  </head>
  <body>
    <!-- Nav -->
    <nav class="nav">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">
          <img
            src="../images/nav-icon.png"
            srcset="../images/nav-icon.png 1x, ../images/nav-icon@2x.png 2x, ../images/nav-icon@3x.png 3x"
            alt="Sailer"
            class="nav-icon"
          />
          Sailer: 音声プレーヤー
        </a>
        <div class="nav-links">
          <a href="support.html" class="nav-link">サポート</a>
          <a href="blog.html" class="nav-link">ブログ</a>
        </div>
        <a
          class="nav-cta"
          href="https://apps.apple.com/jp/app/sailer-音声ファイル再生/id6756638375"
          target="_blank"
          rel="noopener"
        >
          ダウンロード
        </a>
        <button class="nav-toggle" aria-label="メニューを開く" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      <div class="nav-menu">
        <a href="support.html" class="nav-menu-link">サポート</a>
        <a href="blog.html" class="nav-menu-link">ブログ</a>
        <a
          class="nav-menu-link"
          href="https://apps.apple.com/jp/app/sailer-音声ファイル再生/id6756638375"
          target="_blank"
          rel="noopener"
        >
          ダウンロード
        </a>
      </div>
    </nav>
    <script src="../js/nav.js"></script>

    <!-- Blog -->
    <main class="blog-index">
      <div class="blog-index-inner">
        <h1 class="blog-index-title">ブログ</h1>
        <ul class="blog-list">
${listItems}
        </ul>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-copy">&copy; 2026 Shu Kyogoku. All rights reserved.</div>
        <div class="footer-links">
          <a href="../en/blog.html">English</a>
          <a href="privacypolicy.html">プライバシーポリシー</a>
        </div>
      </div>
    </footer>
  </body>
</html>
`;
}

// --- Main ---

function main() {
  fs.mkdirSync(BLOG_DEST, { recursive: true });

  const files = fs
    .readdirSync(BLOG_SRC)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const articles = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_SRC, file), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    const bodyHtml = markdownToHtml(body);

    // Write article HTML
    const dest = path.join(BLOG_DEST, `${meta.slug}.html`);
    fs.writeFileSync(dest, articleTemplate(meta, bodyHtml));
    console.log(`  ${file} -> ja/blog/${meta.slug}.html`);

    return { meta };
  });

  // Sort by date descending
  articles.sort((a, b) => (a.meta.date > b.meta.date ? -1 : 1));

  // Write blog index
  fs.writeFileSync(BLOG_INDEX, blogIndexTemplate(articles));
  console.log(`  -> ja/blog.html (${articles.length} articles)`);

  // Update sitemap
  const sitemapPath = path.join(ROOT, "sitemap.xml");
  let sitemap = fs.readFileSync(sitemapPath, "utf-8");
  // Remove existing blog article entries
  sitemap = sitemap.replace(/\n  <!-- blog articles -->[\s\S]*?<!-- \/blog articles -->/g, "");
  // Build new entries
  const articleEntries = articles
    .map(
      (a) => `  <url>
    <loc>https://sailer.shudev.app/ja/blog/${a.meta.slug}.html</loc>
    <priority>0.6</priority>
  </url>`
    )
    .join("\n");
  // Insert before </urlset>
  sitemap = sitemap.replace(
    "</urlset>",
    `\n  <!-- blog articles -->\n${articleEntries}\n  <!-- /blog articles -->\n</urlset>`
  );
  fs.writeFileSync(sitemapPath, sitemap);
  console.log(`  -> sitemap.xml updated`);
}

console.log("Building blog...");
main();
console.log("Done!");
