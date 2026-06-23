import QUnit from "qunit";
import {
  extractLastSentence,
  parseCogitoQuestionPayload,
  formatCogitoQuestionBlock,
  buildCogitoAnalysisContext,
  buildCogitoUserPrompt,
  isRecoverableModelLoadError,
} from "../../dist/test/cogito.js";

QUnit.module("cogito");

QUnit.test("extractLastSentence returns final complete sentence", (assert) => {
  const result = extractLastSentence("First sentence. Second sentence? Third sentence!");
  assert.strictEqual(result, "Third sentence!");
});

QUnit.test("extractLastSentence handles single sentence without punctuation", (assert) => {
  const result = extractLastSentence("A sentence without punctuation");
  assert.strictEqual(result, "A sentence without punctuation");
});

QUnit.test("parseCogitoQuestionPayload validates exactly three questions", (assert) => {
  const payload = JSON.stringify({
    questions: ["What changed?", "Why now?", "What evidence supports it?"],
  });
  const result = parseCogitoQuestionPayload(payload);
  assert.deepEqual(result, ["What changed?", "Why now?", "What evidence supports it?"]);
});

QUnit.test("parseCogitoQuestionPayload throws when question count is invalid", (assert) => {
  assert.throws(() => {
    parseCogitoQuestionPayload(JSON.stringify({ questions: ["Only one"] }));
  }, /exactly 3 questions/);
});

QUnit.test("formatCogitoQuestionBlock returns required markdown block", (assert) => {
  const result = formatCogitoQuestionBlock("What is your core claim?");
  assert.strictEqual(result, "> ### AI\nWhat is your core claim?\n");
});

QUnit.test("buildCogitoAnalysisContext keeps only compact coaching signals", (assert) => {
  const context = buildCogitoAnalysisContext({
    overallScore: 72,
    overview: {
      priorities: ["Clarify the opening.", "Break up the dense section.", "Add evidence.", "Ignored fourth item."],
      strengths: ["Strong structure.", "Concrete examples.", "Ignored third strength."],
      quickTake: [],
    },
    scores: {},
    sections: [],
    documentSections: [],
  });

  assert.deepEqual(context, {
    overallScore: 72,
    priorities: ["Clarify the opening.", "Break up the dense section.", "Add evidence."],
    strengths: ["Strong structure.", "Concrete examples."],
  });
});

QUnit.test("buildCogitoUserPrompt combines latest sentence with analysis context", (assert) => {
  const prompt = buildCogitoUserPrompt("The conclusion needs sharper evidence.", {
    overallScore: 68,
    priorities: ["Support the main claim."],
    strengths: ["The structure is easy to scan."],
  });

  assert.ok(prompt.includes("Last sentence: The conclusion needs sharper evidence."));
  assert.ok(prompt.includes("Document strength: 68/100"));
  assert.ok(prompt.includes("Support the main claim."));
  assert.ok(prompt.includes("The structure is easy to scan."));
});

QUnit.test("buildCogitoUserPrompt bounds unpunctuated document context", (assert) => {
  const longSentence = "opening " + "detail ".repeat(1000);
  const prompt = buildCogitoUserPrompt(longSentence, {
    overallScore: 50,
    priorities: ["priority ".repeat(1000)],
    strengths: ["strength ".repeat(1000)],
  });
  const promptSentence = prompt.split("\n")[0];

  assert.ok(promptSentence.length <= 1215, "latest-sentence context should have a fixed upper bound");
  assert.ok(promptSentence.includes("…"), "truncated context should be visibly marked");
  assert.ok(promptSentence.endsWith("detail"), "the most recent end of the sentence should be retained");
  assert.ok(prompt.length < 1800, "the complete model prompt should remain compact");
});

QUnit.test("isRecoverableModelLoadError identifies cache and network failures", (assert) => {
  assert.true(
    isRecoverableModelLoadError(
      new Error("Failed to execute 'add' on 'Cache': Cache.add() encountered a network error"),
    ),
  );
  assert.true(isRecoverableModelLoadError(new Error("TypeError: Failed to fetch")));
  assert.false(isRecoverableModelLoadError(new Error("WebGPU is not supported")));
});
