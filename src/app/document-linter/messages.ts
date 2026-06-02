export const DOCUMENT_LINTER_FALLBACK_STRENGTH =
  "No clear strengths stand out yet; the draft needs more signal before the linter can praise specific choices.";

export const DOCUMENT_LINTER_NO_MAJOR_FIXES = "No major fixes stood out.";

export const DOCUMENT_LINTER_NO_NOTABLE_ISSUES = "No notable issues in this category.";

export const DOCUMENT_LINTER_NO_SECTION_STRUCTURE =
  "This note did not expose any obvious structural sections.";

export function openingNeedsStructure(): string {
  return "The note opens cleanly, but it still needs a visible structure signal.";
}

export function openingTooDense(): string {
  return "The first sentence does a lot of work. Tighten it and let the rest of the section carry the supporting detail.";
}

export function openingNeedsStrongerLead(): string {
  return "The opening is understandable, but it could be shaped into a sharper lead sentence.";
}

export function openingIsInformativeNotDirective(): string {
  return "Lead with the payoff or takeaway first, then use the topic sentence to support it.";
}

export function quickTakeStrengthsDetected(): string {
  return "There are real strengths here: concrete details and structure cues give the document memory and shape.";
}

export function quickTakeNeedsScaffold(): string {
  return "The content is solid, but it needs a clearer scaffold so the reader can move through it faster.";
}

export function quickTakeLowSignal(): string {
  return "The draft is too thin or fragmentary to score well yet; add a clearer claim and one or two supporting details.";
}

export function missingHeading(): string {
  return "Add a heading at the top so the chapter reads as a structured note instead of a raw outline.";
}

export function explicitSectionLabel(label: string): string {
  return `Turn "${label}" into a heading so the bullet list has a clean anchor.`;
}

export function bulletsAreDense(): string {
  return "The bullet list has good content, but several bullets carry more than one idea. Consider grouping them by theme or splitting the longest ones.";
}

export function structureSimpleOutline(): string {
  return "This would scan better with three visible beats: a short lead, a grouped facts section, and a closing takeaway.";
}

export function structureBreakMiddle(): string {
  return "The document's logic is good, but the middle section is carrying too much at once. A mid-document heading would make the progression easier to follow.";
}

export function denseAbstractLanguage(): string {
  return "This section leans on a few abstract nouns. It still reads clearly, but a couple of them could be replaced with plainer words.";
}

export function repeatedWord(): string {
  return "A word is repeated back-to-back. Clean that up before worrying about higher-level style.";
}

export function thinDraft(): string {
  return "There is not enough developed prose yet to judge the document fairly. Add a clearer point and at least one supporting sentence.";
}

export function thinSection(): string {
  return "This section is too thin to evaluate well; add a clearer claim or supporting detail.";
}

export function questionNeedsAnswer(): string {
  return "A question can be a good hook, but it needs an immediate answer or payoff.";
}

export function balancedSection(): string {
  return "This section is balanced and easy to follow.";
}

export function sectionNeedsHeading(title: string): string {
  return `The "${title}" block introduces a real section. Promoting it to a heading would make the document easier to scan.`;
}

export function sectionDenseBullets(lineStart: number, bulletCount: number): string {
  return `The section starting at line ${lineStart} has ${bulletCount} bullets and several carry more than one idea.`;
}

export function sectionLong(lineStart: number): string {
  return `The section starting at line ${lineStart} is carrying a lot of text and would be easier to scan if it were split.`;
}

export function sectionLabelPromotion(title: string): string {
  return `Turn "${title}:" into a heading so the section reads as intentional structure.`;
}

export function sectionDenseBulletRun(): string {
  return "This bullet run is dense; split the longest items or group them by theme.";
}

export function sectionLongMaterial(): string {
  return "This section carries a lot of material; consider splitting it into two smaller beats.";
}

export function sectionListNeedsLead(): string {
  return "The heading works, but this section is list-only; a short lead sentence could help orient the reader.";
}

export function sectionNeedsAttention(title: string, note: string): string {
  return `The "${title}" section deserves attention: ${note.toLowerCase()}`;
}

export function strengthConcreteAnchors(): string {
  return "Concrete anchors such as names, dates, or numbers make the material easier to remember.";
}

export function strengthMnemonic(): string {
  return "The document gives the reader a memory hook, which makes the takeaway easier to retain.";
}

export function strengthParallelList(): string {
  return "The parallel list structure creates a strong rhythm and makes the sequence easy to scan.";
}

export function strengthQuestionLead(): string {
  return "The opening question creates forward pull and gives the reader a reason to keep going.";
}

export function strengthDirectiveLead(): string {
  return "The lead uses clear directive language, which gives the document momentum.";
}

export function strengthClearStructure(): string {
  return "The document already has enough visible structure that a reader can scan it quickly.";
}
