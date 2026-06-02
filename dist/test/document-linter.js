// src/app/document-linter/messages.ts
var DOCUMENT_LINTER_FALLBACK_STRENGTH = "No clear strengths stand out yet; the draft needs more signal before the linter can praise specific choices.";
var DOCUMENT_LINTER_NO_MAJOR_FIXES = "No major fixes stood out.";
var DOCUMENT_LINTER_NO_NOTABLE_ISSUES = "No notable issues in this category.";
var DOCUMENT_LINTER_NO_SECTION_STRUCTURE = "This note did not expose any obvious structural sections.";
function openingNeedsStructure() {
  return "The note opens cleanly, but it still needs a visible structure signal.";
}
function openingTooDense() {
  return "The first sentence does a lot of work. Tighten it and let the rest of the section carry the supporting detail.";
}
function openingNeedsStrongerLead() {
  return "The opening is understandable, but it could be shaped into a sharper lead sentence.";
}
function openingIsInformativeNotDirective() {
  return "Lead with the payoff or takeaway first, then use the topic sentence to support it.";
}
function quickTakeStrengthsDetected() {
  return "There are real strengths here: concrete details and structure cues give the document memory and shape.";
}
function quickTakeNeedsScaffold() {
  return "The content is solid, but it needs a clearer scaffold so the reader can move through it faster.";
}
function quickTakeLowSignal() {
  return "The draft is too thin or fragmentary to score well yet; add a clearer claim and one or two supporting details.";
}
function missingHeading() {
  return "Add a heading at the top so the chapter reads as a structured note instead of a raw outline.";
}
function explicitSectionLabel(label) {
  return `Turn "${label}" into a heading so the bullet list has a clean anchor.`;
}
function bulletsAreDense() {
  return "The bullet list has good content, but several bullets carry more than one idea. Consider grouping them by theme or splitting the longest ones.";
}
function structureSimpleOutline() {
  return "This would scan better with three visible beats: a short lead, a grouped facts section, and a closing takeaway.";
}
function structureBreakMiddle() {
  return "The document's logic is good, but the middle section is carrying too much at once. A mid-document heading would make the progression easier to follow.";
}
function denseAbstractLanguage() {
  return "This section leans on a few abstract nouns. It still reads clearly, but a couple of them could be replaced with plainer words.";
}
function repeatedWord() {
  return "A word is repeated back-to-back. Clean that up before worrying about higher-level style.";
}
function thinDraft() {
  return "There is not enough developed prose yet to judge the document fairly. Add a clearer point and at least one supporting sentence.";
}
function thinSection() {
  return "This section is too thin to evaluate well; add a clearer claim or supporting detail.";
}
function questionNeedsAnswer() {
  return "A question can be a good hook, but it needs an immediate answer or payoff.";
}
function balancedSection() {
  return "This section is balanced and easy to follow.";
}
function sectionNeedsHeading(title) {
  return `The "${title}" block introduces a real section. Promoting it to a heading would make the document easier to scan.`;
}
function sectionDenseBullets(lineStart, bulletCount) {
  return `The section starting at line ${lineStart} has ${bulletCount} bullets and several carry more than one idea.`;
}
function sectionLong(lineStart) {
  return `The section starting at line ${lineStart} is carrying a lot of text and would be easier to scan if it were split.`;
}
function sectionLabelPromotion(title) {
  return `Turn "${title}:" into a heading so the section reads as intentional structure.`;
}
function sectionDenseBulletRun() {
  return "This bullet run is dense; split the longest items or group them by theme.";
}
function sectionLongMaterial() {
  return "This section carries a lot of material; consider splitting it into two smaller beats.";
}
function sectionListNeedsLead() {
  return "The heading works, but this section is list-only; a short lead sentence could help orient the reader.";
}
function sectionNeedsAttention(title, note) {
  return `The "${title}" section deserves attention: ${note.toLowerCase()}`;
}
function strengthConcreteAnchors() {
  return "Concrete anchors such as names, dates, or numbers make the material easier to remember.";
}
function strengthMnemonic() {
  return "The document gives the reader a memory hook, which makes the takeaway easier to retain.";
}
function strengthParallelList() {
  return "The parallel list structure creates a strong rhythm and makes the sequence easy to scan.";
}
function strengthQuestionLead() {
  return "The opening question creates forward pull and gives the reader a reason to keep going.";
}
function strengthDirectiveLead() {
  return "The lead uses clear directive language, which gives the document momentum.";
}
function strengthClearStructure() {
  return "The document already has enough visible structure that a reader can scan it quickly.";
}

// src/app/document-linter/document-linter.ts
var CATEGORY_META = [
  { id: "readability", title: "Readability", color: "#4CAF50" },
  { id: "skimmability", title: "Skimmability", color: "#2196F3" },
  { id: "engagement", title: "Engagement", color: "#FF9800" },
  { id: "style", title: "Style", color: "#9C27B0" },
  { id: "structure", title: "Structure", color: "#607D8B" }
];
function clampScore(score) {
  return Math.max(0, Math.min(100, score));
}
function countWords(text) {
  return text.match(/\b\w+\b/g)?.length ?? 0;
}
function splitSentences(text) {
  return text.replaceAll(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
}
function countSentences(text) {
  return splitSentences(text).length;
}
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function scoreWeight(severity) {
  if (severity === "high") {
    return 3;
  }
  if (severity === "medium") {
    return 2;
  }
  return 1;
}
function createLineButtonMarkup(lineStart, label = `Line ${lineStart}`) {
  return `<button class="documentLinterLineButton" type="button" data-linter-line="${lineStart}" data-linter-focus-key="line-${lineStart}">${escapeHtml(label)}</button>`;
}
function isFencedCodeStart(line) {
  return /^```/.test(line.trim());
}
function isAtxHeading(line) {
  return /^#{1,6}\s+/.test(line.trim());
}
function isOrderedListItem(line) {
  return /^\s*\d+[.)]\s+/.test(line);
}
function isUnorderedListItem(line) {
  return /^\s*[-*+]\s+/.test(line);
}
function isListItem(line) {
  return isUnorderedListItem(line) || isOrderedListItem(line);
}
function isBlockquoteLine(line) {
  return /^\s*>\s?/.test(line);
}
function isIndentedCodeLine(line) {
  return /^(?:\t| {4,})/.test(line);
}
function getSectionLabelTitle(block, nextBlock) {
  if (block.type === "paragraph" && /:\s*$/.test(block.text) && nextBlock?.type === "list_item") {
    return block.text.replace(/:\s*$/, "");
  }
  return null;
}
function listMarkerPrefix(line) {
  return line.replace(/^(\s*(?:[-*+]|\d+[.)]))\s+.*$/, "$1");
}
function stripListMarker(line) {
  return line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "").trim();
}
function normalizeBlockText(lines) {
  return lines.map((line) => line.trim()).join(" ").replaceAll(/\s+/g, " ").trim();
}
function parseMarkdownBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNumber = i + 1;
    if (trimmed === "") {
      i += 1;
      continue;
    }
    if (isFencedCodeStart(line)) {
      const startLine2 = lineNumber;
      const codeLines = [line];
      i += 1;
      while (i < lines.length && !isFencedCodeStart(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push({
        type: "code",
        text: codeLines.join("\n"),
        lineStart: startLine2,
        lineEnd: Math.max(startLine2, i)
      });
      continue;
    }
    if (isIndentedCodeLine(line)) {
      const startLine2 = lineNumber;
      const codeLines = [line.replace(/^(?:\t| {4})/, "")];
      i += 1;
      while (i < lines.length && (isIndentedCodeLine(lines[i]) || lines[i].trim() === "")) {
        codeLines.push(lines[i].trim() === "" ? "" : lines[i].replace(/^(?:\t| {4})/, ""));
        i += 1;
      }
      blocks.push({
        type: "code",
        text: codeLines.join("\n"),
        lineStart: startLine2,
        lineEnd: i
      });
      continue;
    }
    if (i + 1 < lines.length && trimmed && /^(=+|-+)\s*$/.test(lines[i + 1].trim())) {
      blocks.push({
        type: "heading",
        text: trimmed,
        lineStart: lineNumber,
        lineEnd: lineNumber + 1,
        level: lines[i + 1].trim().startsWith("=") ? 1 : 2
      });
      i += 2;
      continue;
    }
    if (isAtxHeading(line)) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        blocks.push({
          type: "heading",
          text: match[2].trim(),
          lineStart: lineNumber,
          lineEnd: lineNumber,
          level: match[1].length
        });
      }
      i += 1;
      continue;
    }
    if (isListItem(line)) {
      const marker = listMarkerPrefix(line);
      blocks.push({
        type: "list_item",
        text: stripListMarker(line),
        lineStart: lineNumber,
        lineEnd: lineNumber
      });
      i += 1;
      while (i < lines.length) {
        const nextLine = lines[i];
        if (nextLine.trim() === "") {
          break;
        }
        if (listMarkerPrefix(nextLine) !== marker || !isListItem(nextLine)) {
          break;
        }
        blocks.push({
          type: "list_item",
          text: stripListMarker(nextLine),
          lineStart: i + 1,
          lineEnd: i + 1
        });
        i += 1;
      }
      continue;
    }
    if (isBlockquoteLine(line)) {
      const startLine2 = lineNumber;
      const quoteLines = [];
      while (i < lines.length) {
        const currentLine = lines[i];
        if (isBlockquoteLine(currentLine)) {
          quoteLines.push(currentLine.replace(/^\s*>\s?/, "").trim());
          i += 1;
          continue;
        }
        if (currentLine.trim() === "" && i + 1 < lines.length && isBlockquoteLine(lines[i + 1])) {
          quoteLines.push("");
          i += 1;
          continue;
        }
        break;
      }
      blocks.push({
        type: "blockquote",
        text: normalizeBlockText(quoteLines),
        lineStart: startLine2,
        lineEnd: i
      });
      continue;
    }
    const startLine = lineNumber;
    const paragraphLines = [trimmed];
    i += 1;
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();
      if (nextTrimmed === "" || isFencedCodeStart(nextLine) || isAtxHeading(nextLine) || isListItem(nextLine) || isBlockquoteLine(nextLine) || isIndentedCodeLine(nextLine) || i + 1 < lines.length && /^(=+|-+)\s*$/.test(lines[i + 1].trim())) {
        break;
      }
      paragraphLines.push(nextTrimmed);
      i += 1;
    }
    blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" ").trim(),
      lineStart: startLine,
      lineEnd: startLine + paragraphLines.length - 1
    });
  }
  return blocks;
}
function getBlocksOfType(blocks, type) {
  return blocks.filter((block) => block.type === type);
}
function getPlainTextBlocks(blocks) {
  return blocks.filter((block) => {
    return block.type === "paragraph" || block.type === "blockquote";
  });
}
function findRepeatedWord(text) {
  const match = text.match(/\b([a-z][a-z'-]{1,})\b(?:\s+\1\b)/i);
  if (!match || typeof match.index !== "number") {
    return null;
  }
  return { word: match[1], index: match.index };
}
function createFinding(category, severity, title, detail, section, isStrength = false) {
  return { category, severity, title, detail, section, isStrength };
}
function summarizeOpeners(blocks) {
  const firstParagraph = blocks.find((block) => block.type === "paragraph");
  if (!firstParagraph) {
    return openingNeedsStructure();
  }
  if (countWords(firstParagraph.text) >= 22) {
    return openingTooDense();
  }
  if (/^(this|these)\b/i.test(firstParagraph.text)) {
    return openingIsInformativeNotDirective();
  }
  return openingNeedsStrongerLead();
}
function detectPseudoSectionLabel(blocks) {
  for (let i = 0; i < blocks.length - 1; i += 1) {
    const block = blocks[i];
    const nextBlock = blocks[i + 1];
    if (getSectionLabelTitle(block, nextBlock)) {
      return block;
    }
  }
  return null;
}
function buildDocumentSections(blocks) {
  const sections = [];
  let currentSection = null;
  function startSection(title, kind, lineStart) {
    const nextSection = {
      title,
      kind,
      lineStart,
      lineEnd: lineStart,
      blocks: []
    };
    sections.push(nextSection);
    currentSection = nextSection;
    return nextSection;
  }
  function ensureLeadSection(block) {
    if (currentSection) {
      return currentSection;
    }
    return startSection("Lead", "implicit", block.lineStart);
  }
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const nextBlock = blocks[i + 1];
    if (block.type === "heading") {
      startSection(block.text, "heading", block.lineStart);
      continue;
    }
    const labelTitle = getSectionLabelTitle(block, nextBlock);
    if (labelTitle) {
      startSection(labelTitle, "label", block.lineStart);
      continue;
    }
    const activeSection = ensureLeadSection(block);
    activeSection.blocks.push(block);
    activeSection.lineEnd = block.lineEnd;
  }
  if (sections.length === 0) {
    return [
      {
        title: "Document",
        kind: "implicit",
        lineStart: 1,
        lineEnd: 1,
        blocks: []
      }
    ];
  }
  return sections;
}
function analyzeReadability(blocks) {
  const proseBlocks = getPlainTextBlocks(blocks);
  const findings = [];
  let longSentenceCount = 0;
  let repeatedWordCount = 0;
  for (const block of proseBlocks) {
    const sentences = splitSentences(block.text);
    const repeatedWordMatch = findRepeatedWord(block.text);
    if (repeatedWordMatch) {
      repeatedWordCount += 1;
      if (!findings.some((finding) => finding.title === "Repeated word")) {
        findings.push(
          createFinding(
            "readability",
            "medium",
            "Repeated word",
            repeatedWord(),
            `Line ${block.lineStart}`
          )
        );
      }
    }
    for (const sentence of sentences) {
      const wordCount = countWords(sentence);
      const charCount = sentence.length;
      if (wordCount >= 24 || charCount >= 140) {
        longSentenceCount += 1;
        if (findings.length < 3) {
          const snippet = sentence.length > 70 ? `${sentence.slice(0, 70)}...` : sentence;
          findings.push(
            createFinding(
              "readability",
              "medium",
              "Dense sentence",
              `This sentence is carrying too much at once: "${snippet}". Split the idea or move the setup into a heading.`,
              `Line ${block.lineStart}`
            )
          );
        }
      }
    }
  }
  const openingBlock = proseBlocks[0];
  if (openingBlock && countWords(openingBlock.text) >= 22) {
    findings.unshift(
      createFinding(
        "readability",
        "high",
        "Opening is dense",
        openingTooDense(),
        `Line ${openingBlock.lineStart}`
      )
    );
  }
  const score = clampScore(
    100 - longSentenceCount * 14 - repeatedWordCount * 10 - (openingBlock && countWords(openingBlock.text) >= 22 ? 8 : 0)
  );
  return {
    result: {
      score,
      suggestions: findings.map((finding) => `${finding.title}: ${finding.detail}`)
    },
    findings
  };
}
function analyzeSkimmability(blocks) {
  const headings = getBlocksOfType(blocks, "heading");
  const bullets = getBlocksOfType(blocks, "list_item");
  const pseudoSectionLabel = detectPseudoSectionLabel(blocks);
  const findings = [];
  if (headings.length === 0) {
    findings.push(
      createFinding(
        "skimmability",
        "high",
        "Missing heading",
        missingHeading(),
        "Document"
      )
    );
  }
  if (pseudoSectionLabel) {
    findings.push(
      createFinding(
        "skimmability",
        "medium",
        "Make the section label explicit",
        explicitSectionLabel(pseudoSectionLabel.text),
        `Line ${pseudoSectionLabel.lineStart}`
      )
    );
  }
  if (bullets.length >= 4) {
    const averageBulletWords = bullets.reduce((sum, block) => sum + countWords(block.text), 0) / bullets.length;
    if (averageBulletWords >= 11) {
      findings.push(
        createFinding(
          "skimmability",
          "medium",
          "Bullets are dense",
          bulletsAreDense(),
          "Bullet list"
        )
      );
    }
  }
  const score = clampScore(
    100 - (headings.length === 0 ? 20 : 0) - (pseudoSectionLabel ? 6 : 0) - (bullets.length >= 4 ? 10 : 0)
  );
  return {
    result: {
      score,
      suggestions: findings.map((finding) => `${finding.title}: ${finding.detail}`)
    },
    findings,
    pseudoSectionLabel
  };
}
function analyzeEngagement(blocks) {
  const text = blocks.map((block) => block.text).join(" ");
  const firstParagraph = blocks.find((block) => block.type === "paragraph");
  const openings = firstParagraph?.text ?? "";
  const findings = [];
  const strengths = [];
  const totalWords = countWords(text);
  const openingSentence = splitSentences(openings)[0] ?? openings;
  const openingWords = countWords(openingSentence);
  const hasOpeningQuestion = /\?\s*$/.test(openingSentence);
  const hasDirectiveLead = /^(remember|consider|notice|start|imagine|picture|look|think)\b/i.test(openingSentence);
  const passiveMatches = text.match(/\b(?:was|were|is|are|be|been|being)\s+\w+ed\b/gi) ?? [];
  const sentences = splitSentences(text);
  const passiveRatio = sentences.length > 0 ? passiveMatches.length / sentences.length : 0;
  const uniqueWords = new Set((text.toLowerCase().match(/\b[a-z][a-z'-]+\b/g) ?? []).filter((word) => word.length >= 4));
  const lexicalVariety = countWords(text) > 0 ? uniqueWords.size / countWords(text) : 0;
  const directiveMatches = text.match(/\b(?:remember|consider|notice|focus|compare|look|keep|start)\b/gi) ?? [];
  const concreteAnchorMatches = text.match(/\b(?:\d{2,4}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g) ?? [];
  const mnemonicMatches = text.match(/\b(?:remember|key takeaway|simple way to remember|think of|in short)\b/gi) ?? [];
  const bulletTexts = getBlocksOfType(blocks, "list_item").map((block) => block.text);
  const bulletStarts = bulletTexts.map((bullet) => (bullet.match(/^[A-Za-z]+/)?.[0] ?? "").toLowerCase()).filter(Boolean);
  const repeatedBulletStart = bulletStarts.find((start, index) => start && bulletStarts.indexOf(start) !== index);
  if (/^(this|these)\b/i.test(openingSentence) && openingWords >= 8) {
    findings.push(
      createFinding(
        "engagement",
        "medium",
        "Opening is informative, not directive",
        openingIsInformativeNotDirective(),
        `Line ${firstParagraph?.lineStart ?? 1}`
      )
    );
  }
  if (totalWords > 0 && totalWords < 12) {
    findings.push(
      createFinding(
        "engagement",
        "high",
        "Too little context",
        thinDraft(),
        `Line ${firstParagraph?.lineStart ?? 1}`
      )
    );
  }
  if (hasOpeningQuestion && totalWords < 18) {
    findings.push(
      createFinding(
        "engagement",
        "medium",
        "Question needs payoff",
        questionNeedsAnswer(),
        `Line ${firstParagraph?.lineStart ?? 1}`
      )
    );
  }
  if (hasOpeningQuestion) {
    strengths.push(strengthQuestionLead());
  }
  if (hasDirectiveLead || directiveMatches.length >= 2) {
    strengths.push(strengthDirectiveLead());
  }
  if (mnemonicMatches.length > 0) {
    strengths.push(strengthMnemonic());
  }
  if (concreteAnchorMatches.length >= 2) {
    strengths.push(strengthConcreteAnchors());
  }
  if (repeatedBulletStart && bulletTexts.length >= 3) {
    strengths.push(strengthParallelList());
  }
  if (strengths.length === 0 && (getBlocksOfType(blocks, "heading").length > 0 || bulletTexts.length >= 3)) {
    strengths.push(strengthClearStructure());
  }
  const score = clampScore(
    48 + (hasOpeningQuestion ? 10 : 0) + (hasDirectiveLead ? 10 : 0) + Math.min(strengths.length, 3) * 8 + (lexicalVariety >= 0.28 ? 6 : 0) + (openingWords > 0 && openingWords <= 16 ? 6 : 0) - (totalWords > 0 && totalWords < 12 ? 18 : 0) - (passiveRatio >= 0.4 ? 12 : 0) - findings.length * 8
  );
  return {
    result: {
      score,
      suggestions: findings.map((finding) => `${finding.title}: ${finding.detail}`)
    },
    findings,
    strengths
  };
}
function analyzeStyle(blocks) {
  const prose = getPlainTextBlocks(blocks).map((block) => block.text).join(" ");
  const nominalizations = prose.match(/\b\w+(?:tion|sion|ment|ness|ance|ence)\b/gi) ?? [];
  const findings = [];
  const repeatedWordMatch = findRepeatedWord(prose);
  const uniqueNominalizations = [...new Set(nominalizations.map((word) => word.toLowerCase()))];
  if (uniqueNominalizations.length >= 4) {
    findings.push(
      createFinding(
        "style",
        "low",
        "Dense abstract language",
        denseAbstractLanguage(),
        "Document"
      )
    );
  }
  if (repeatedWordMatch) {
    findings.unshift(
      createFinding(
        "style",
        "medium",
        "Repeated word",
        repeatedWord(),
        "Document"
      )
    );
  }
  const score = clampScore(96 - Math.min(uniqueNominalizations.length, 4) * 2 - (repeatedWordMatch ? 14 : 0));
  return {
    result: {
      score,
      suggestions: findings.map((finding) => `${finding.title}: ${finding.detail}`)
    },
    findings
  };
}
function analyzeStructure(blocks) {
  const headings = getBlocksOfType(blocks, "heading");
  const bullets = getBlocksOfType(blocks, "list_item");
  const paragraphs = getBlocksOfType(blocks, "paragraph");
  const findings = [];
  const totalWords = countWords(blocks.map((block) => block.text).join(" "));
  if (headings.length === 0 && paragraphs.length > 0 && bullets.length > 0) {
    findings.push(
      createFinding(
        "structure",
        "high",
        "Add a simple outline",
        structureSimpleOutline(),
        "Document"
      )
    );
  }
  if (bullets.length >= 5 && headings.length === 0) {
    findings.push(
      createFinding(
        "structure",
        "medium",
        "Break up the middle",
        structureBreakMiddle(),
        "Bullet list"
      )
    );
  }
  if (totalWords > 0 && totalWords < 12) {
    findings.push(
      createFinding(
        "structure",
        "high",
        "Draft is too thin",
        thinDraft(),
        "Document"
      )
    );
  }
  const score = clampScore(86 - (headings.length === 0 ? 12 : 0) - (bullets.length >= 5 ? 8 : 0) - (totalWords > 0 && totalWords < 12 ? 22 : 0));
  return {
    result: {
      score,
      suggestions: findings.map((finding) => `${finding.title}: ${finding.detail}`)
    },
    findings
  };
}
function analyzeDocumentSections(sections) {
  const findings = [];
  const sectionNotes = sections.map((section) => {
    const text = section.blocks.map((block) => block.text).join(" ");
    const bullets = section.blocks.filter((block) => block.type === "list_item");
    const proseBlocks = section.blocks.filter((block) => block.type === "paragraph" || block.type === "blockquote");
    const words = countWords(text);
    const averageBulletWords = bullets.length > 0 ? bullets.reduce((sum, block) => sum + countWords(block.text), 0) / bullets.length : 0;
    const notes = [];
    let needsAttention = false;
    if (section.kind === "label") {
      notes.push(sectionLabelPromotion(section.title));
      needsAttention = true;
      findings.push(
        createFinding(
          "structure",
          "medium",
          "Convert label into heading",
          sectionNeedsHeading(section.title),
          `Line ${section.lineStart}`
        )
      );
    }
    if (bullets.length >= 4 && averageBulletWords >= 11) {
      notes.push(sectionDenseBulletRun());
      needsAttention = true;
      findings.push(
        createFinding(
          "structure",
          "medium",
          "Dense bullet section",
          sectionDenseBullets(section.lineStart, bullets.length),
          `Line ${section.lineStart}`
        )
      );
    }
    if (words >= 90 && proseBlocks.length >= 2) {
      notes.push(sectionLongMaterial());
      needsAttention = true;
      findings.push(
        createFinding(
          "structure",
          "low",
          "Long section",
          sectionLong(section.lineStart),
          `Line ${section.lineStart}`
        )
      );
    }
    if (section.kind === "heading" && bullets.length > 0 && proseBlocks.length === 0) {
      notes.push(sectionListNeedsLead());
    }
    if (words > 0 && words < 12 && proseBlocks.length > 0) {
      notes.push(thinSection());
      needsAttention = true;
    }
    if (notes.length === 0) {
      notes.push(balancedSection());
    }
    return {
      title: section.title,
      kind: section.kind,
      lineStart: section.lineStart,
      lineEnd: section.lineEnd,
      notes,
      needsAttention
    };
  });
  return { findings, sectionNotes };
}
function buildOverview(findings, strengths, blocks, documentSections) {
  const totalWords = countWords(blocks.map((block) => block.text).join(" "));
  const priorities = findings.filter((finding) => !finding.isStrength).slice().sort((a, b) => scoreWeight(b.severity) - scoreWeight(a.severity)).slice(0, 4).map((finding) => `${finding.title} \u2014 ${finding.detail}`);
  const quickTake = [summarizeOpeners(blocks)];
  const sectionThatNeedsAttention = documentSections.find((section) => section.needsAttention);
  if (sectionThatNeedsAttention) {
    quickTake.push(sectionNeedsAttention(sectionThatNeedsAttention.title, sectionThatNeedsAttention.notes[0]));
  }
  if (strengths.length > 0) {
    quickTake.push(quickTakeStrengthsDetected());
  } else if (totalWords > 0 && totalWords < 12) {
    quickTake.push(quickTakeLowSignal());
  } else {
    quickTake.push(quickTakeNeedsScaffold());
  }
  return {
    quickTake,
    priorities,
    strengths: strengths.length > 0 ? strengths : [DOCUMENT_LINTER_FALLBACK_STRENGTH]
  };
}
function computeOverallScore(scores) {
  const weights = {
    readability: 0.25,
    skimmability: 0.2,
    engagement: 0.2,
    style: 0.15,
    structure: 0.2
  };
  const total = Object.entries(scores).reduce((sum, [categoryId, result]) => {
    return sum + result.score * weights[categoryId];
  }, 0);
  return clampScore(Math.round(total));
}
function restoreResultsPanelState(resultsContainer, scrollTop, focusKey) {
  resultsContainer.scrollTop = scrollTop;
  if (!focusKey) {
    return;
  }
  if (typeof resultsContainer.querySelector !== "function") {
    return;
  }
  const nextFocusTarget = resultsContainer.querySelector(`[data-linter-focus-key="${focusKey}"]`);
  nextFocusTarget?.focus();
}
function isElementLike(value) {
  return typeof value === "object" && value !== null && "getAttribute" in value;
}
function analyzeDocumentText(text) {
  const blocks = parseMarkdownBlocks(text);
  const documentSections = buildDocumentSections(blocks);
  const readability = analyzeReadability(blocks);
  const skimmability = analyzeSkimmability(blocks);
  const engagement = analyzeEngagement(blocks);
  const style = analyzeStyle(blocks);
  const structure = analyzeStructure(blocks);
  const sectionAnalysis = analyzeDocumentSections(documentSections);
  const allFindings = [
    ...readability.findings,
    ...skimmability.findings,
    ...engagement.findings,
    ...style.findings,
    ...structure.findings,
    ...sectionAnalysis.findings
  ];
  const sectionNotes = [
    {
      title: "Readability",
      lines: readability.findings.map((finding) => `- ${finding.title}: ${finding.detail}`)
    },
    {
      title: "Skimmability",
      lines: skimmability.findings.map((finding) => `- ${finding.title}: ${finding.detail}`)
    },
    {
      title: "Engagement",
      lines: engagement.findings.map((finding) => `- ${finding.title}: ${finding.detail}`)
    },
    {
      title: "Style",
      lines: style.findings.map((finding) => `- ${finding.title}: ${finding.detail}`)
    },
    {
      title: "Structure",
      lines: structure.findings.map((finding) => `- ${finding.title}: ${finding.detail}`)
    }
  ];
  const scores = {
    readability: readability.result,
    skimmability: skimmability.result,
    engagement: engagement.result,
    style: style.result,
    structure: structure.result
  };
  return {
    scores,
    overallScore: computeOverallScore(scores),
    overview: buildOverview(allFindings, engagement.strengths, blocks, sectionAnalysis.sectionNotes),
    sections: sectionNotes,
    documentSections: sectionAnalysis.sectionNotes
  };
}
function buildDocumentLinterReport(text, analysis) {
  const blocks = parseMarkdownBlocks(text);
  const wordCount = countWords(text);
  const sentenceCount = countSentences(getPlainTextBlocks(blocks).map((block) => block.text).join(" "));
  const sections = CATEGORY_META.map((category) => {
    const section = analysis.sections.find((entry) => entry.title === category.title);
    return {
      title: category.title,
      lines: section?.lines?.length ? section.lines : [`- ${DOCUMENT_LINTER_NO_NOTABLE_ISSUES}`]
    };
  });
  const documentSections = analysis.documentSections.length > 0 ? analysis.documentSections : [
    {
      title: "Document",
      kind: "implicit",
      lineStart: 1,
      lineEnd: 1,
      notes: [DOCUMENT_LINTER_NO_SECTION_STRUCTURE],
      needsAttention: false
    }
  ];
  const lines = [
    "# Document Linter Review",
    "",
    "## Overall",
    `- Overall score: ${analysis.overallScore}/100`,
    "",
    "## Quick take",
    ...analysis.overview.quickTake.map((line) => `- ${line}`),
    "",
    "## What to fix first",
    ...analysis.overview.priorities.length > 0 ? analysis.overview.priorities.map((priority, index) => `${index + 1}. ${priority}`) : [`- ${DOCUMENT_LINTER_NO_MAJOR_FIXES}`],
    "",
    "## What is working",
    ...analysis.overview.strengths.map((strength) => `- ${strength}`),
    "",
    "## Section notes",
    ...sections.flatMap((section) => [
      `### ${section.title}`,
      ...section.lines,
      ""
    ]),
    "## Section analysis",
    ...documentSections.flatMap((section) => [
      `### ${section.title}`,
      `- Type: ${section.kind}`,
      `- Lines: ${section.lineStart}\u2013${section.lineEnd}`,
      `- Needs attention: ${section.needsAttention ? "yes" : "no"}`,
      ...section.notes.map((note) => `- ${note}`),
      ""
    ]),
    "## Snapshot",
    `- Words: ${wordCount}`,
    `- Sentences: ${sentenceCount}`,
    `- Blocks: ${blocks.length}`
  ];
  return lines.join("\n");
}
function createDocumentLinterController({
  els,
  getEditorText,
  onEditorContentReplaced: _onEditorContentReplaced,
  showToast,
  setStatus
}) {
  let isPanelOpen = false;
  let isAnalyzing = false;
  let autoRunEnabled = false;
  let lastAnalysis = null;
  let lastTextSnapshot = "";
  async function runAnalysis(textSnapshot = getEditorText()) {
    return Promise.resolve(analyzeDocumentText(textSnapshot));
  }
  function scrollEditorToLine(lineNumber) {
    const lines = els.editor.value.split("\n");
    const clampedLine = Math.max(1, Math.min(lineNumber, lines.length || 1));
    let selectionStart = 0;
    for (let lineIndex = 0; lineIndex < clampedLine - 1; lineIndex += 1) {
      selectionStart += lines[lineIndex].length + 1;
    }
    els.editor.focus();
    els.editor.setSelectionRange(selectionStart, selectionStart);
    const computedLineHeight = typeof window.getComputedStyle === "function" ? Number.parseFloat(window.getComputedStyle(els.editor).lineHeight) : Number.NaN;
    const lineHeight = Number.isFinite(computedLineHeight) ? computedLineHeight : 20;
    els.editor.scrollTop = Math.max(0, (clampedLine - 1) * lineHeight);
  }
  function setPanelVisibility(isOpen) {
    isPanelOpen = isOpen;
    els.documentLinterPanel.hidden = !isOpen;
    els.documentLinterToggleBtn.setAttribute("aria-expanded", String(isOpen));
    const split = els.documentLinterPanel.closest(".split");
    if (split) {
      split.classList.toggle("with-document-linter", isOpen);
    }
  }
  function updateResultsPanel(analysis) {
    const resultsContainer = els.documentLinterResults;
    const previousScrollTop = resultsContainer.scrollTop;
    const activeElement = isElementLike(document.activeElement) ? document.activeElement : null;
    const focusKey = activeElement?.closest?.("#documentLinterResults") ? activeElement.getAttribute("data-linter-focus-key") : null;
    resultsContainer.innerHTML = "";
    const summary = document.createElement("section");
    summary.className = "documentLinterSummary";
    summary.innerHTML = `
      <div class="documentLinterSummaryBlock">
        <h3>Overall</h3>
        <div class="documentLinterScore">${analysis.overallScore}/100</div>
      </div>
      <div class="documentLinterSummaryBlock">
        <h3>Quick take</h3>
        <ul>
          ${analysis.overview.quickTake.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
      </div>
      <div class="documentLinterSummaryBlock">
        <h3>What to fix first</h3>
        <ol>
          ${analysis.overview.priorities.map((line) => `<li>${escapeHtml(line)}</li>`).join("") || `<li>${escapeHtml(DOCUMENT_LINTER_NO_MAJOR_FIXES)}</li>`}
        </ol>
      </div>
      <div class="documentLinterSummaryBlock">
        <h3>What is working</h3>
        <ul>
          ${analysis.overview.strengths.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
      </div>
    `;
    resultsContainer.appendChild(summary);
    CATEGORY_META.forEach((category) => {
      const result = analysis.scores[category.id];
      const sectionNotes = analysis.sections.find((section) => section.title === category.title)?.lines ?? [];
      const categoryElement = document.createElement("div");
      categoryElement.className = "documentLinterCategory";
      categoryElement.innerHTML = `
        <div class="documentLinterCategoryHeader" style="border-left: 4px solid ${category.color};">
          <h3>${category.title}</h3>
          <div class="documentLinterScore">${result.score}/100</div>
        </div>
        <div class="documentLinterSuggestions">
          ${sectionNotes.length > 0 ? sectionNotes.map((note) => `<div class="documentLinterSuggestion">${escapeHtml(note)}</div>`).join("") : `<div class="documentLinterSuggestion">${escapeHtml(DOCUMENT_LINTER_NO_NOTABLE_ISSUES)}</div>`}
        </div>
      `;
      resultsContainer.appendChild(categoryElement);
    });
    const sectionAnalysis = document.createElement("section");
    sectionAnalysis.className = "documentLinterSectionAnalysis";
    sectionAnalysis.innerHTML = `
      <h3>Section analysis</h3>
      <div class="documentLinterSectionList">
        ${analysis.documentSections.length > 0 ? analysis.documentSections.map(
      (section) => `
                    <article class="documentLinterSectionCard">
                      <div class="documentLinterSectionHeader">
                        <h4>${escapeHtml(section.title)}</h4>
                        <span>${escapeHtml(section.kind)} \xB7 ${createLineButtonMarkup(section.lineStart, `Lines ${section.lineStart}\u2013${section.lineEnd}`)} \xB7 ${section.needsAttention ? "needs attention" : "stable"}</span>
                      </div>
                      <div class="documentLinterSectionNotes">
                        ${section.notes.map((note) => `<div class="documentLinterSuggestion">${escapeHtml(note)}</div>`).join("")}
                      </div>
                    </article>
                  `
    ).join("") : `<article class="documentLinterSectionCard"><div class="documentLinterSuggestion">${escapeHtml(
      DOCUMENT_LINTER_NO_SECTION_STRUCTURE
    )}</div></article>`}
      </div>
    `;
    resultsContainer.appendChild(sectionAnalysis);
    restoreResultsPanelState(resultsContainer, previousScrollTop, focusKey);
  }
  function downloadMarkdownReport(markdown) {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const dateStamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const fileName = `ink-linter-report-${dateStamp}.md`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  async function analyzeDocumentAction() {
    if (isAnalyzing) {
      return;
    }
    const text = getEditorText();
    if (!text.trim()) {
      showToast("No content to analyze", { persist: true });
      setStatus("No content to analyze", "warn");
      return;
    }
    isAnalyzing = true;
    lastTextSnapshot = text;
    els.documentLinterAnalyzeBtn.disabled = true;
    els.documentLinterStatus.textContent = "Analyzing document...";
    try {
      const analysis = await runAnalysis(text);
      lastAnalysis = analysis;
      updateResultsPanel(analysis);
      els.documentLinterStatus.textContent = "Analysis complete";
      showToast("Document analysis completed");
      setStatus("Analysis complete", "ok");
    } catch (error) {
      els.documentLinterStatus.textContent = "Analysis failed";
      showToast(`Document analysis failed: ${String(error)}`, { persist: true });
      setStatus("Analysis failed", "err");
    } finally {
      isAnalyzing = false;
      els.documentLinterAnalyzeBtn.disabled = false;
    }
  }
  async function exportSuggestionsAction() {
    const text = getEditorText();
    if (!text.trim()) {
      showToast("No content to export", { persist: true });
      setStatus("No content to export", "warn");
      return;
    }
    try {
      const needsFreshAnalysis = text !== lastTextSnapshot || !lastAnalysis;
      if (needsFreshAnalysis) {
        els.documentLinterStatus.textContent = "Document changed; re-analyzing before export...";
        setStatus("Re-analyzing before export", "warn");
      }
      const analysis = needsFreshAnalysis ? await runAnalysis(text) : lastAnalysis;
      lastAnalysis = analysis;
      lastTextSnapshot = text;
      const report = buildDocumentLinterReport(text, analysis);
      downloadMarkdownReport(report);
      showToast("Exported linter review as Markdown.");
      setStatus("Exported report", "ok");
    } catch (error) {
      showToast(`Failed to export linter report: ${String(error)}`, { persist: true });
      setStatus("Export failed", "err");
    }
  }
  async function handleEditorChanged(textSnapshot = getEditorText()) {
    if (!isPanelOpen || !autoRunEnabled || isAnalyzing || !textSnapshot.trim()) {
      if (!textSnapshot.trim() && autoRunEnabled && isPanelOpen) {
        lastAnalysis = null;
        lastTextSnapshot = textSnapshot;
        els.documentLinterStatus.textContent = "No content to analyze";
      }
      return Promise.resolve();
    }
    if (textSnapshot === lastTextSnapshot) {
      return Promise.resolve();
    }
    return analyzeDocumentAction();
  }
  els.documentLinterAutoRunToggle.checked = autoRunEnabled;
  els.documentLinterAutoRunToggle.addEventListener("change", () => {
    autoRunEnabled = els.documentLinterAutoRunToggle.checked;
    els.documentLinterStatus.textContent = autoRunEnabled ? "Rerun on change enabled" : "Rerun on change disabled";
  });
  els.documentLinterResults.addEventListener("click", (event) => {
    const target = event.target;
    const lineButton = target?.closest("[data-linter-line]");
    if (!lineButton) {
      return;
    }
    const lineNumber = Number(lineButton.getAttribute("data-linter-line"));
    if (Number.isNaN(lineNumber)) {
      return;
    }
    scrollEditorToLine(lineNumber);
  });
  setPanelVisibility(false);
  return {
    togglePanel: () => {
      setPanelVisibility(!isPanelOpen);
      if (isPanelOpen) {
        els.documentLinterStatus.textContent = "Ready to analyze document";
      }
    },
    setPanelOpen: (nextIsOpen) => {
      setPanelVisibility(nextIsOpen);
      if (nextIsOpen) {
        els.documentLinterStatus.textContent = "Ready to analyze document";
      }
    },
    isPanelOpen: () => isPanelOpen,
    closePanel: () => {
      setPanelVisibility(false);
    },
    handleEditorChanged,
    analyzeDocument: analyzeDocumentAction,
    exportSuggestions: exportSuggestionsAction
  };
}
export {
  analyzeDocumentText,
  buildDocumentLinterReport,
  buildDocumentSections,
  countSentences,
  createDocumentLinterController,
  parseMarkdownBlocks,
  splitSentences
};
