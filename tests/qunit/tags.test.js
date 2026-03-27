import QUnit from "qunit";
import {
  extractFrontMatter,
  normalizeTag,
  parseFrontmatterTags,
  parseTags,
} from "../../dist/test/tags.js";

QUnit.module("tags parsing");

QUnit.test("extracts YAML frontmatter", (assert) => {
  const text = "---\ntags: [work, docs]\n---\n\n# Note";
  assert.strictEqual(extractFrontMatter(text), "tags: [work, docs]");
});

QUnit.test("returns empty frontmatter when closing delimiter is missing", (assert) => {
  const text = "---\ntags: [work, docs]\n\n# Note";
  assert.strictEqual(extractFrontMatter(text), "");
});

QUnit.test("normalizes hashtag input and strips invalid characters", (assert) => {
  assert.strictEqual(normalizeTag("  #Work/Area!!  "), "work/area");
  assert.strictEqual(normalizeTag("###"), "");
  assert.strictEqual(normalizeTag(""), "");
});

QUnit.test("parses frontmatter tags from inline and block syntaxes", (assert) => {
  const fm = [
    "tags: [work, docs]",
    "topic: markdown",
    "tags:",
    "  - notes",
    "  - personal",
  ].join("\n");

  const tags = parseFrontmatterTags(fm);
  assert.deepEqual([...tags].sort(), ["docs", "notes", "personal", "work"]);
});

QUnit.test("ignores empty and invalid frontmatter tag entries", (assert) => {
  const fm = [
    "tags: [\"\", !!!, work]",
    "tags:",
    "  - \"\"",
    "  - $$$",
    "  - docs",
  ].join("\n");

  const tags = parseFrontmatterTags(fm);
  assert.deepEqual([...tags].sort(), ["docs", "work"]);
});

QUnit.test("parses combined frontmatter and inline hashtag tags", (assert) => {
  const text = [
    "---",
    "tags: [work]",
    "---",
    "",
    "# Weekly notes",
    "Track #project-alpha updates and #work planning",
  ].join("\n");

  const tags = parseTags(text);
  assert.deepEqual([...tags].sort(), ["project-alpha", "work"]);
});

QUnit.test("deduplicates tags across frontmatter and inline content", (assert) => {
  const text = [
    "---",
    "tags: [work, docs]",
    "---",
    "",
    "Update #work and #docs this week",
  ].join("\n");

  const tags = parseTags(text);
  assert.deepEqual([...tags].sort(), ["docs", "work"]);
});

QUnit.test("parses hashtags with punctuation and slash correctly", (assert) => {
  const text = "Check (#release/v1), #alpha, and trailing #beta.";
  const tags = parseTags(text);

  assert.deepEqual([...tags].sort(), ["alpha", "beta", "release/v1"]);
});
