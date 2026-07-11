/**
 * repair-blog-html.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time migration script.  Scans every blog document in MongoDB and
 * normalises malformed HTML content that was produced by the old
 * execCommand("formatBlock") editor bug:
 *
 *   • Removes redundant <span style="font-weight:normal|400|font-style:normal">
 *     wrappers left behind when bold/italic was toggled off.
 *
 *   • Collapses same-tag duplicate block nesting, e.g.:
 *       <h2><h2>text</h2></h2>  →  <h2>text</h2>
 *
 *   • Collapses block-inside-heading nesting, e.g.:
 *       <blockquote><h2><blockquote>text</blockquote></h2></blockquote>
 *       →  <h2>text</h2>
 *
 * The script NEVER strips text content.  Only structural/wrapper tags are
 * removed.  It runs fully offline against your MongoDB instance.
 *
 * Usage
 * ─────
 *   # Preview changes without writing (safe):
 *   node scripts/repair-blog-html.js --dry-run
 *
 *   # Apply changes:
 *   node scripts/repair-blog-html.js
 *
 *   # Apply changes but skip a specific blog (by _id or slug):
 *   node scripts/repair-blog-html.js --skip=<id_or_slug>
 *
 * Notes
 * ─────
 *   • Uses the raw MongoDB collection (bypasses Mongoose pre("validate") hook)
 *     so the model's own sanitizer does not re-process the repaired HTML.
 *   • The script is idempotent: running it twice produces the same result.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

require("dotenv").config({ path: "./.env" });

const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// CLI flags
// ─────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SKIP_ARG = args.find((a) => a.startsWith("--skip="));
const SKIP_VALUE = SKIP_ARG ? SKIP_ARG.replace("--skip=", "").trim() : null;

// ─────────────────────────────────────────────────────────────────────────────
// Pure-regex HTML normaliser  (no jsdom / extra dependencies)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Block-level tags that can be structurally problematic when nested.
 * These are the only tags whose nesting we collapse.
 */
const BLOCK_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "p", "div"];

/**
 * Strip <span> wrappers that carry only a redundant inline style produced by
 * execCommand("bold") / execCommand("italic") toggling off:
 *   font-weight: normal  |  font-weight: 400  |  font-style: normal
 *
 * Also strips completely empty <span>…</span> (no attributes at all).
 * Meaningful spans (e.g. colour, font-size) are left untouched.
 *
 * Runs iteratively to catch nested redundant spans.
 */
function stripRedundantSpans(html) {
  let prev;
  do {
    prev = html;

    // 1. Bare <span> with no attributes at all
    html = html.replace(/<span>([^<]*)<\/span>/gi, "$1");

    // 2. <span style="font-weight: normal|400"> or <span style="font-style: normal">
    //    The value may be wrapped in single or double quotes, or no quotes.
    html = html.replace(
      /<span\s+style\s*=\s*["']?\s*(?:font-weight\s*:\s*(?:normal|400)|font-style\s*:\s*normal)\s*;?\s*["']?\s*>([^<]*)<\/span>/gi,
      "$1"
    );
  } while (html !== prev);

  return html;
}

/**
 * Collapse same-tag self-nesting, e.g.:
 *   <h2><h2>text</h2></h2>          →  <h2>text</h2>
 *   <blockquote><blockquote>…</blockquote></blockquote>  →  <blockquote>…</blockquote>
 *
 * Runs iteratively for each block tag until no more matches are found.
 */
function collapseSameTagNesting(html) {
  for (const tag of BLOCK_TAGS) {
    let prev;
    do {
      prev = html;
      // Match <tag[attrs]>  whitespace  <tag[attrs]>  CONTENT  </tag>  whitespace  </tag>
      const re = new RegExp(
        `<(${tag})(\\s[^>]*)?>\\s*<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>\\s*<\\/${tag}>`,
        "gi"
      );
      html = html.replace(re, `<$1$2>$3</${tag}>`);
    } while (html !== prev);
  }
  return html;
}

/**
 * Collapse a block element nested as the sole content of a heading, e.g.:
 *   <h2><blockquote>text</blockquote></h2>  →  <h2>text</h2>
 *
 * The heading tag wins; the inner block wrapper is removed.
 */
function collapseBlockInsideHeading(html) {
  let prev;
  do {
    prev = html;
    for (const inner of BLOCK_TAGS) {
      const re = new RegExp(
        `(<h[1-6](?:\\s[^>]*)?>)\\s*<${inner}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${inner}>\\s*(<\\/h[1-6]>)`,
        "gi"
      );
      html = html.replace(re, "$1$2$3");
    }
  } while (html !== prev);
  return html;
}

/**
 * Collapse a more-specific block element inside a generic block wrapper, e.g.:
 *   <blockquote><h2>text</h2></blockquote>    →  <h2>text</h2>
 *   <blockquote><pre>code</pre></blockquote>  →  <pre>code</pre>
 *   <div><h2>text</h2></div>                  →  <h2>text</h2>
 *
 * The inner (more specific) tag wins; the outer wrapper is discarded.
 *
 * Outer tags considered generic: blockquote, div, p
 * Inner tags that win: h1–h6, blockquote (when outer is div/p), pre
 */
function collapseBlockInsideBlock(html) {
  const OUTER_GENERIC = ["blockquote", "div", "p"];
  const INNER_SPECIFIC = ["h1", "h2", "h3", "h4", "h5", "h6", "pre"];

  let prev;
  do {
    prev = html;
    for (const outer of OUTER_GENERIC) {
      for (const inner of INNER_SPECIFIC) {
        if (outer === inner) continue;
        const re = new RegExp(
          `<${outer}(?:\\s[^>]*)?>\\s*(<${inner}(?:\\s[^>]*)?>)([\\s\\S]*?)(<\\/${inner}>)\\s*<\\/${outer}>`,
          "gi"
        );
        html = html.replace(re, "$1$2$3");
      }
    }
  } while (html !== prev);
  return html;
}

/**
 * Master normaliser — runs all passes in order then repeats once to
 * catch any additional nesting that was exposed after the first sweep.
 */
function normaliseHtml(raw) {
  if (!raw || typeof raw !== "string") return raw || "";

  let html = raw;

  const sweep = () => {
    html = stripRedundantSpans(html);
    html = collapseSameTagNesting(html);
    html = collapseBlockInsideHeading(html);
    html = collapseBlockInsideBlock(html);
  };

  sweep(); // first pass
  sweep(); // second pass catches chains exposed by the first

  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff helper — prints a human-readable diff summary
// ─────────────────────────────────────────────────────────────────────────────
function summariseDiff(original, cleaned) {
  const lines = [];
  lines.push(`  Size: ${original.length} → ${cleaned.length} chars (${original.length - cleaned.length >= 0 ? "-" : "+"}${Math.abs(original.length - cleaned.length)} chars removed)`);

  // Find first difference and show context
  const minLen = Math.min(original.length, cleaned.length);
  for (let i = 0; i < minLen; i++) {
    if (original[i] !== cleaned[i]) {
      const start = Math.max(0, i - 40);
      const end = Math.min(i + 80, Math.max(original.length, cleaned.length));
      lines.push(`  First diff at char ${i}:`);
      lines.push(`    BEFORE: …${original.slice(start, end).replace(/\r?\n/g, "↵")}…`);
      lines.push(`    AFTER : …${cleaned.slice(start, end).replace(/\r?\n/g, "↵")}…`);
      break;
    }
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Self-test — run against known patterns before touching any data
// ─────────────────────────────────────────────────────────────────────────────
function selfTest() {
  const cases = [
    // ── Same-tag nesting ──────────────────────────────────────────────────
    {
      label: "h2 nested in h2",
      input: "<h2><h2>Hello</h2></h2>",
      expect: "<h2>Hello</h2>",
    },
    {
      label: "h2 triple-nested",
      input: "<h2><h2><h2>Deep</h2></h2></h2>",
      expect: "<h2>Deep</h2>",
    },
    {
      label: "blockquote nested in blockquote",
      input: "<blockquote><blockquote>Quote</blockquote></blockquote>",
      expect: "<blockquote>Quote</blockquote>",
    },
    // ── Block inside heading ──────────────────────────────────────────────
    {
      label: "blockquote inside h2",
      input: "<h2><blockquote>Heading text</blockquote></h2>",
      expect: "<h2>Heading text</h2>",
    },
    {
      label: "p inside h3",
      input: "<h3><p>Heading text</p></h3>",
      expect: "<h3>Heading text</h3>",
    },
    // ── Cross-nesting ─────────────────────────────────────────────────────
    {
      label: "blockquote > h2 > blockquote (reported bug)",
      input: "<blockquote><h2><blockquote>Text</blockquote></h2></blockquote>",
      expect: "<h2>Text</h2>",
    },
    // ── Block inside block ────────────────────────────────────────────────
    {
      label: "h2 inside blockquote",
      input: "<blockquote><h2>Heading</h2></blockquote>",
      expect: "<h2>Heading</h2>",
    },
    {
      label: "pre inside div",
      input: "<div><pre>code</pre></div>",
      expect: "<pre>code</pre>",
    },
    // ── Redundant spans ───────────────────────────────────────────────────
    {
      label: "span with no attributes",
      input: "<p><span>text</span></p>",
      expect: "<p>text</p>",
    },
    {
      label: "span style font-weight:normal",
      input: '<p><span style="font-weight: normal">text</span></p>',
      expect: "<p>text</p>",
    },
    {
      label: "span style font-weight:400",
      input: '<p><span style="font-weight:400">text</span></p>',
      expect: "<p>text</p>",
    },
    {
      label: "span style font-style:normal",
      input: '<p><span style="font-style: normal">text</span></p>',
      expect: "<p>text</p>",
    },
    // ── Must NOT be changed ───────────────────────────────────────────────
    {
      label: "meaningful span (color) — must be preserved",
      input: '<p><span style="color:red">red</span></p>',
      expect: '<p><span style="color:red">red</span></p>',
    },
    {
      label: "<strong> inside p — must be preserved",
      input: "<p><strong>bold</strong> normal</p>",
      expect: "<p><strong>bold</strong> normal</p>",
    },
    {
      label: "clean ul/li — must be unchanged",
      input: "<ul><li>Item one</li><li>Item two</li></ul>",
      expect: "<ul><li>Item one</li><li>Item two</li></ul>",
    },
    {
      label: "already clean content — must be unchanged",
      input: "<h2>Heading</h2><p>Para</p><blockquote>Quote</blockquote>",
      expect: "<h2>Heading</h2><p>Para</p><blockquote>Quote</blockquote>",
    },
  ];

  console.log("\n──────────────────────────────────────────────────");
  console.log("  Self-test  (" + cases.length + " cases)");
  console.log("──────────────────────────────────────────────────");

  let passed = 0;
  let failed = 0;

  for (const { label, input, expect } of cases) {
    const result = normaliseHtml(input);
    if (result === expect) {
      console.log(`  ✅  ${label}`);
      passed++;
    } else {
      console.log(`  ❌  ${label}`);
      console.log(`       input   : ${input}`);
      console.log(`       expected: ${expect}`);
      console.log(`       got     : ${result}`);
      failed++;
    }
  }

  console.log("──────────────────────────────────────────────────");
  console.log(`  ${passed} passed  /  ${failed} failed`);
  console.log("──────────────────────────────────────────────────\n");

  if (failed > 0) {
    throw new Error(
      `Self-test failed (${failed} case${failed > 1 ? "s" : ""}). ` +
      "Aborting — no database changes have been made."
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  console.log("\n╔═══════════════════════════════════════════════════╗");
  console.log("║        Blog HTML Repair — Migration Script        ║");
  console.log(`║  Mode : ${DRY_RUN
    ? "DRY RUN  (no writes will be made)  "
    : "LIVE     (writing to MongoDB)      "}║`);
  if (SKIP_VALUE) {
    console.log(`║  Skip : ${String(SKIP_VALUE).padEnd(40)}║`);
  }
  console.log("╚═══════════════════════════════════════════════════╝\n");

  // Step 1 — self-test normaliser before touching any data
  selfTest();

  // Step 2 — connect
  console.log("Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log("Connected.\n");

  // Step 3 — build query (skip filter if requested)
  const collection = mongoose.connection.db.collection("blogs");

  const matchFilter = {};
  if (SKIP_VALUE) {
    if (mongoose.Types.ObjectId.isValid(SKIP_VALUE)) {
      matchFilter._id = { $ne: new mongoose.Types.ObjectId(SKIP_VALUE) };
    } else {
      matchFilter.slug = { $ne: SKIP_VALUE };
    }
  }

  const blogs = await collection
    .find(matchFilter, {
      projection: { _id: 1, slug: 1, title: 1, content: 1 },
    })
    .toArray();

  console.log(`Found ${blogs.length} blog${blogs.length !== 1 ? "s" : ""} to inspect.\n`);

  // Step 4 — process each blog
  let inspected = 0;
  let needsFix = 0;
  let written = 0;
  let errors = 0;

  for (const blog of blogs) {
    inspected++;
    const label = `[${String(inspected).padStart(String(blogs.length).length)}/${blogs.length}] "${blog.title || blog.slug || blog._id}"`;

    if (!blog.content || typeof blog.content !== "string") {
      console.log(`${label} — skipped (empty content)`);
      continue;
    }

    const cleaned = normaliseHtml(blog.content);

    if (cleaned === blog.content) {
      console.log(`${label} — ✅ already clean`);
      continue;
    }

    needsFix++;
    console.log(`${label} — ⚠️  repair needed`);
    console.log(summariseDiff(blog.content, cleaned));

    if (DRY_RUN) {
      console.log("  [dry-run] Write skipped.\n");
      continue;
    }

    try {
      await collection.updateOne(
        { _id: blog._id },
        {
          $set: {
            content: cleaned,
            updatedAt: new Date(),
          },
        }
      );
      written++;
      console.log("  ✅ Written.\n");
    } catch (err) {
      errors++;
      console.error(`  ❌ Write failed: ${err.message}\n`);
    }
  }

  // Step 5 — summary
  const sep = "═".repeat(51);
  console.log(`\n╔${sep}╗`);
  console.log(`║${"  Summary".padEnd(51)}║`);
  console.log(`╠${sep}╣`);
  console.log(`║  Inspected   : ${String(inspected).padEnd(35)}║`);
  console.log(`║  Needed fix  : ${String(needsFix).padEnd(35)}║`);
  if (DRY_RUN) {
    console.log(`║  Written     : 0  (dry run — re-run without --dry-run to apply)  ║`.slice(0, 53) + "║");
  } else {
    console.log(`║  Written     : ${String(written).padEnd(35)}║`);
    console.log(`║  Errors      : ${String(errors).padEnd(35)}║`);
  }
  console.log(`╚${sep}╝\n`);

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("\nFatal:", err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
