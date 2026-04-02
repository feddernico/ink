import QUnit from "qunit";
import {
  extractLastSentence,
  parseCogitoQuestionPayload,
  formatCogitoQuestionBlock,
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
