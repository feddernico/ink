import QUnit from "qunit";
import { escapeHtml } from "../../dist/test/utils.js";

QUnit.module("escapeHtml");

QUnit.test("escapes ampersand", (assert) => {
  assert.strictEqual(escapeHtml("a & b"), "a &amp; b");
});

QUnit.test("escapes multiple ampersands", (assert) => {
  assert.strictEqual(escapeHtml("a & b & c"), "a &amp; b &amp; c");
});

QUnit.test("escapes less-than", (assert) => {
  assert.strictEqual(escapeHtml("a < b"), "a &lt; b");
});

QUnit.test("escapes multiple less-than signs", (assert) => {
  assert.strictEqual(escapeHtml("a < b < c"), "a &lt; b &lt; c");
});

QUnit.test("escapes greater-than", (assert) => {
  assert.strictEqual(escapeHtml("a > b"), "a &gt; b");
});

QUnit.test("escapes double quotes", (assert) => {
  assert.strictEqual(escapeHtml('say "hello"'), "say &quot;hello&quot;");
});

QUnit.test("escapes single quotes", (assert) => {
  assert.strictEqual(escapeHtml("it's"), "it&#039;s");
});

QUnit.test("escapes all special characters together", (assert) => {
  assert.strictEqual(
    escapeHtml('<script>alert("xss & \'fun\'");</script>'),
    "&lt;script&gt;alert(&quot;xss &amp; &#039;fun&#039;&quot;);&lt;/script&gt;"
  );
});

QUnit.test("converts non-string input to string", (assert) => {
  assert.strictEqual(escapeHtml(42), "42");
});

QUnit.test("returns empty string unchanged", (assert) => {
  assert.strictEqual(escapeHtml(""), "");
});

QUnit.test("leaves plain text unchanged", (assert) => {
  assert.strictEqual(escapeHtml("hello world"), "hello world");
});
