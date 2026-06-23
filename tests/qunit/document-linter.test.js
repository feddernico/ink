import QUnit from "qunit";
import {
  analyzeDocumentText,
  buildDocumentLinterReport,
  buildDocumentSections,
  countSentences,
  createDocumentLinterController,
  parseMarkdownBlocks,
} from "../../dist/test/document-linter.js";

function createClassList() {
  const classes = new Set();
  return {
    add(value) {
      classes.add(value);
    },
    remove(value) {
      classes.delete(value);
    },
    toggle(value, force) {
      if (force === undefined) {
        if (classes.has(value)) {
          classes.delete(value);
          return false;
        }
        classes.add(value);
        return true;
      }
      if (force) {
        classes.add(value);
        return true;
      }
      classes.delete(value);
      return false;
    },
    contains(value) {
      return classes.has(value);
    },
  };
}

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.hidden = false;
    this.disabled = false;
    this.textContent = "";
    this.innerHTML = "";
    this.className = "";
    this.children = [];
    this.parentNode = null;
    this.classList = createClassList();
    this.attributes = new Map();
    this.closestMap = new Map();
    this.clicked = false;
    this.listeners = new Map();
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.scrollTop = 0;
    this.value = "";
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter((candidate) => candidate !== child);
    child.parentNode = null;
    return child;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  closest(selector) {
    return this.closestMap.get(selector) ?? null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatchEvent(event) {
    event.target = this;
    const listeners = this.listeners.get(event.type) ?? [];
    listeners.forEach((listener) => listener(event));
    return true;
  }

  focus() {
    global.document.activeElement = this;
  }

  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }

  click() {
    this.clicked = true;
  }
}

function createControllerDomRefs() {
  const editor = new FakeElement("textarea");
  editor.value = "";

  return {
    editor,
    documentLinterAnalyzeBtn: new FakeElement("button"),
    documentLinterExportBtn: new FakeElement("button"),
    documentLinterAutoRunToggle: new FakeElement("input"),
    documentLinterStatus: new FakeElement("div"),
    documentLinterResults: new FakeElement("div"),
  };
}

QUnit.module("document-linter", (hooks) => {
  hooks.beforeEach(function () {
    this.originalDocument = global.document;
    this.originalWindow = global.window;
    this.originalURL = global.URL;
    this.originalBlob = global.Blob;

    const fakeDocument = {
      body: new FakeElement("body"),
      activeElement: null,
      createElement(tagName) {
        return new FakeElement(tagName);
      },
    };

    global.document = fakeDocument;
    global.window = {
      setTimeout,
      clearTimeout,
      getComputedStyle() {
        return { lineHeight: "20" };
      },
    };
    global.URL = {
      created: [],
      revoked: [],
      createObjectURL(blob) {
        this.created.push(blob);
        return "blob:fake-report";
      },
      revokeObjectURL(url) {
        this.revoked.push(url);
      },
    };
    global.Blob = class FakeBlob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    };
  });

  hooks.afterEach(function () {
    global.document = this.originalDocument;
    global.window = this.originalWindow;
    global.URL = this.originalURL;
    global.Blob = this.originalBlob;
  });

  QUnit.test("parseMarkdownBlocks handles ordered lists, setext headings, quotes, and open code fences", function (assert) {
    const text = `Overview
---

1. First point
2. Second point
   - nested detail

> quoted paragraph
>
> still quoted

    const value = 1;

\`\`\`js
console.log("open fence")
`;

    const blocks = parseMarkdownBlocks(text);

    assert.deepEqual(
      blocks.map((block) => block.type),
      ["heading", "list_item", "list_item", "list_item", "blockquote", "code", "code"],
      "markdown blocks should preserve structure-aware block types",
    );
    assert.strictEqual(blocks[0].text, "Overview", "setext heading should be parsed as a heading");
    assert.strictEqual(blocks[4].text, "quoted paragraph still quoted", "blockquote paragraphs should be merged");
    assert.ok(blocks[6].text.includes("console.log(\"open fence\")"), "unterminated fenced code should still become a code block");
    assert.strictEqual(parseMarkdownBlocks("#NoSpace")[0].type, "paragraph", "headings without a space should stay as paragraph text");
  });

  QUnit.test("buildDocumentSections creates a lead section for quote-first documents and detects label sections", function (assert) {
    const text = `> Opening quote

Facts to keep:
- One
- Two

## Timeline
Paragraph after heading.`;

    const sections = buildDocumentSections(parseMarkdownBlocks(text));

    assert.deepEqual(
      sections.map((section) => ({ title: section.title, kind: section.kind })),
      [
        { title: "Lead", kind: "implicit" },
        { title: "Facts to keep", kind: "label" },
        { title: "Timeline", kind: "heading" },
      ],
      "sections should preserve implicit lead content before label and heading sections",
    );
  });

  QUnit.test("analyzeDocumentText scores and flags long prose while preserving generic strengths", function (assert) {
    const text = `This chapter is about how early cities were formed across river valleys, and it keeps layering context, chronology, social change, and settlement details into one long opening sentence that asks the reader to hold too much at once.

Remember this:
- Compare river access with food storage
- Compare crop surplus with trade growth
- Compare dense neighborhoods with social roles`;

    const analysis = analyzeDocumentText(text);

    assert.ok(analysis.scores.readability.score < 100, "readability score should drop for dense prose");
    assert.ok(analysis.overallScore > 0, "analysis should include an aggregate overall score");
    assert.ok(
      analysis.scores.readability.suggestions.some((suggestion) => suggestion.includes("Dense sentence")),
      "readability suggestions should include the long sentence warning",
    );
    assert.ok(
      analysis.overview.strengths.some((strength) => strength.includes("memory hook") || strength.includes("structure")),
      "generic strengths should be surfaced without topic-specific place-name heuristics",
    );
    assert.ok(
      analysis.documentSections.some((section) => section.title === "Remember this" && section.needsAttention),
      "section analysis should carry an explicit needsAttention flag",
    );
  });

  QUnit.test("analyzeDocumentText treats thin repetitive drafts as low-signal", function (assert) {
    const text = `Gennaro is bruno always always

Why not bannarpo?`;
    const analysis = analyzeDocumentText(text);

    assert.ok(analysis.overallScore < 70, "thin repetitive drafts should not receive a flattering overall score");
    assert.ok(
      analysis.sections.find((section) => section.title === "Readability")?.lines.some((line) => line.includes("Repeated word")),
      "repeated words should produce an explicit finding",
    );
    assert.ok(
      analysis.sections.find((section) => section.title === "Structure")?.lines.some((line) => line.includes("Draft is too thin")),
      "very short drafts should be flagged as too thin to evaluate well",
    );
    assert.ok(
      analysis.overview.strengths[0].includes("No clear strengths stand out yet"),
      "fallback strengths copy should no longer pretend the draft has a factual backbone",
    );
    assert.ok(
      analysis.documentSections[0].needsAttention,
      "thin lead sections should be marked as needing attention instead of balanced by default",
    );
  });

  QUnit.test("buildDocumentLinterReport produces a stable markdown snapshot", function (assert) {
    const text = `Why did the first ports grow so quickly?

## Signals
- Look for ships
- Look for storage jars
- Look for taxes`;
    const analysis = analyzeDocumentText(text);
    const report = buildDocumentLinterReport(text, analysis);

    assert.strictEqual(
      report,
      `# Document Linter Review

## Overall
- Overall score: 95/100

## Quick take
- The opening is understandable, but it could be shaped into a sharper lead sentence.
- The "Lead" section deserves attention: this section is too thin to evaluate well; add a clearer claim or supporting detail.
- There are real strengths here: concrete details and structure cues give the document memory and shape.

## What to fix first
- No major fixes stood out.

## What is working
- The opening question creates forward pull and gives the reader a reason to keep going.
- The lead uses clear directive language, which gives the document momentum.
- The parallel list structure creates a strong rhythm and makes the sequence easy to scan.

## Section notes
### Readability
- No notable issues in this category.

### Skimmability
- No notable issues in this category.

### Engagement
- No notable issues in this category.

### Style
- No notable issues in this category.

### Structure
- No notable issues in this category.

## Section analysis
### Lead
- Type: implicit
- Lines: 1–1
- Needs attention: yes
- This section is too thin to evaluate well; add a clearer claim or supporting detail.

### Signals
- Type: heading
- Lines: 3–6
- Needs attention: no
- The heading works, but this section is list-only; a short lead sentence could help orient the reader.

## Snapshot
- Words: 19
- Sentences: 1
- Blocks: 5`,
      "markdown export should remain stable for the tested document",
    );
  });

  QUnit.test("empty, single-word, and heading-only documents remain analyzable", function (assert) {
    const emptyAnalysis = analyzeDocumentText("");
    const singleWordAnalysis = analyzeDocumentText("Hello");
    const headingOnlyAnalysis = analyzeDocumentText("## Title");

    assert.strictEqual(emptyAnalysis.documentSections[0].title, "Document", "empty documents should produce a fallback section");
    assert.strictEqual(singleWordAnalysis.overview.quickTake.length > 0, true, "single-word documents should still produce overview copy");
    assert.strictEqual(headingOnlyAnalysis.documentSections[0].title, "Title", "heading-only documents should preserve the heading section");
  });

  QUnit.test("list items are not miscounted as prose sentences in the exported snapshot", function (assert) {
    const text = `- First item.
- Second item.
- Third item.`;
    const analysis = analyzeDocumentText(text);
    const report = buildDocumentLinterReport(text, analysis);

    assert.strictEqual(countSentences(""), 0, "empty text should have zero sentences");
    assert.ok(report.includes("- Sentences: 0"), "list-only documents should not count list items as prose sentences");
  });

  QUnit.test("createDocumentLinterController renders results, updates status, and guards empty content", async function (assert) {
    const els = createControllerDomRefs();
    const toasts = [];
    const statuses = [];
    const analysisUpdates = [];
    let currentText = "";

    const controller = createDocumentLinterController({
      els,
      getEditorText: () => currentText,
      onEditorContentReplaced: () => {},
      showToast: (message, options) => {
        toasts.push({ message, options });
      },
      setStatus: (message, kind) => {
        statuses.push({ message, kind });
      },
      onAnalysisUpdated: (analysis, revision) => {
        analysisUpdates.push({ analysis, revision });
      },
    });

    controller.setActive(true);

    await controller.analyzeDocument();

    assert.deepEqual(
      toasts[0],
      { message: "No content to analyze", options: { persist: true } },
      "empty content should surface a persistent toast",
    );
    assert.deepEqual(statuses[0], { message: "No content to analyze", kind: "warn" }, "empty content should set warning status");

    currentText = `Remember this:
- Start with the treaty
- Start with the ships
- Start with the tax records`;
    els.editor.value = currentText;

    await controller.analyzeDocument();

    assert.strictEqual(els.documentLinterAnalyzeBtn.disabled, false, "analyze button should be re-enabled after analysis");
    assert.strictEqual(els.documentLinterStatus.textContent, "Analysis complete", "status copy should update after analysis");
    assert.ok(els.documentLinterResults.children.length >= 3, "results panel should render summary, categories, and section analysis");
    assert.ok(
      els.documentLinterResults.children[0].innerHTML.includes("Overall"),
      "summary markup should include the overall score block",
    );
    assert.deepEqual(statuses.at(-1), { message: "Analysis complete", kind: "ok" }, "successful analysis should report ok status");
    assert.strictEqual(controller.getLatestAnalysis().overallScore > 0, true, "latest analysis should be available to Cogito");
    assert.strictEqual(controller.getAnalysisRevision(), 1, "analysis revision should advance");
    assert.strictEqual(analysisUpdates.length, 1, "analysis updates should be published to the unified panel orchestrator");

    els.documentLinterAutoRunToggle.checked = true;
    els.documentLinterAutoRunToggle.dispatchEvent({ type: "change" });
    currentText = `${currentText}\n- Start with the market tolls`;
    els.editor.value = currentText;
    const firstScheduledAnalysis = controller.handleEditorChanged(currentText);
    currentText = `${currentText}\n- Finish with the harbor records`;
    els.editor.value = currentText;
    const secondScheduledAnalysis = controller.handleEditorChanged(currentText);
    await Promise.all([firstScheduledAnalysis, secondScheduledAnalysis]);

    assert.strictEqual(els.documentLinterStatus.textContent, "Analysis complete", "rerun on change should trigger a fresh analysis");
    assert.strictEqual(controller.getAnalysisRevision(), 2, "rapid edits should coalesce into one new analysis revision");

    currentText = "## Summary\nUpdated text";
    els.editor.value = currentText;
    await controller.exportSuggestions();

    assert.deepEqual(statuses.at(-2), { message: "Re-analyzing before export", kind: "warn" }, "export should explicitly announce re-analysis when content changed");
    assert.deepEqual(statuses.at(-1), { message: "Exported report", kind: "ok" }, "export should finish with ok status");
  });
});
