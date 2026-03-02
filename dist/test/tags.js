// src/tags.ts
function normalizeTag(value) {
  return (value || "").trim().replace(/^#+/, "").replace(/[^\w\-/]+/g, "").toLowerCase();
}
function extractFrontMatter(text) {
  if (!text.startsWith("---")) {
    return "";
  }
  const end = text.indexOf("\n---", 3);
  if (end === -1) {
    return "";
  }
  return text.slice(3, end).trim();
}
function parseFrontmatterTags(frontMatter) {
  const tags = /* @__PURE__ */ new Set();
  const lines = frontMatter.split("\n");
  for (const line of lines) {
    const inlineListMatch = line.match(/^\s*tags\s*:\s*\[(.*)\]\s*$/i);
    if (!inlineListMatch) {
      continue;
    }
    const parts = inlineListMatch[1].split(",").map((part) => normalizeTag(part.replace(/["']/g, "")));
    for (const part of parts) {
      if (part) {
        tags.add(part);
      }
    }
  }
  let inTagsBlock = false;
  for (const line of lines) {
    if (/^\s*tags\s*:\s*$/i.test(line)) {
      inTagsBlock = true;
      continue;
    }
    if (!inTagsBlock) {
      continue;
    }
    const item = line.match(/^\s*-\s*(.+)\s*$/);
    if (item) {
      const tag = normalizeTag(item[1].replace(/["']/g, ""));
      if (tag) {
        tags.add(tag);
      }
      continue;
    }
    if (line.trim() !== "" && !/^\s+/.test(line)) {
      inTagsBlock = false;
    }
  }
  return tags;
}
function parseTags(text) {
  const tags = /* @__PURE__ */ new Set();
  const frontMatter = extractFrontMatter(text);
  if (frontMatter) {
    const frontMatterTags = parseFrontmatterTags(frontMatter);
    for (const tag of frontMatterTags) {
      tags.add(tag);
    }
  }
  const inlineMatches = text.match(/\B#([a-zA-Z0-9][\w\-/]{1,50})\b/g);
  if (inlineMatches) {
    for (const match of inlineMatches) {
      const tag = normalizeTag(match);
      if (tag) {
        tags.add(tag);
      }
    }
  }
  return tags;
}
export {
  extractFrontMatter,
  normalizeTag,
  parseFrontmatterTags,
  parseTags
};
