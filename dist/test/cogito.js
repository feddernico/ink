// src/app/cogito.ts
var COGITO_PROMPT = `You are a writing coach.

Rules:
- Do NOT write prose.
- Do NOT suggest sentences.
- Ask exactly 3 questions.
- Questions must be grounded in the user's last sentence.
- Output JSON only in this format:
{
  "questions": ["...", "...", "..."]
}`;
var LITE_MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
var DEEP_MODEL = "Qwen3-8B-q4f16_1-MLC";
function extractLastSentence(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  const fragments = normalized.split(/(?<=[.!?])\s+/).map((fragment) => fragment.trim()).filter(Boolean);
  if (fragments.length === 0) {
    return "";
  }
  return fragments[fragments.length - 1];
}
function parseCogitoQuestionPayload(raw) {
  const jsonText = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(jsonText);
  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error("Cogito response did not include a questions array.");
  }
  const sanitized = parsed.questions.filter((q) => typeof q === "string" && q.trim().length > 0).map((q) => q.trim());
  if (sanitized.length === 0) {
    throw new Error("Cogito response contained no valid questions.");
  }
  if (sanitized.length !== 3) {
    throw new Error("Cogito response must contain exactly 3 questions.");
  }
  return sanitized;
}
function formatCogitoQuestionBlock(question) {
  return `> ### AI
${question.trim()}
`;
}
function insertTextAtCursor(textarea, text) {
  const { selectionStart, selectionEnd, value } = textarea;
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  textarea.value = `${before}${text}${after}`;
  const nextCursor = before.length + text.length;
  textarea.setSelectionRange(nextCursor, nextCursor);
}
function createCogitoController({
  els,
  getEditorText,
  onEditorContentReplaced,
  showToast,
  setStatus
}) {
  let isPanelOpen = false;
  let generatedQuestions = [];
  let selectedModel = "lite";
  const engineCache = {};
  async function loadWebLlmModule() {
    const testModule = globalThis.__INK_TEST_WEBLLM__;
    if (testModule) {
      return testModule;
    }
    return import("https://esm.run/@mlc-ai/web-llm");
  }
  function selectModel(model) {
    selectedModel = model;
    els.cogitoLiteBtn.classList.toggle("active", model === "lite");
    els.cogitoDeepBtn.classList.toggle("active", model === "deep");
  }
  function setPanelVisibility(isOpen) {
    isPanelOpen = isOpen;
    els.cogitoPanel.hidden = !isOpen;
    els.cogitoToggleBtn.setAttribute("aria-expanded", String(isOpen));
    const split = els.cogitoPanel.closest(".split");
    if (split) {
      split.classList.toggle("with-cogito", isOpen);
    }
  }
  function updateQuestionList(questions) {
    els.cogitoQuestionList.innerHTML = "";
    questions.forEach((question, index) => {
      const item = document.createElement("li");
      item.className = "cogitoQuestionItem";
      const text = document.createElement("p");
      text.className = "cogitoQuestionText";
      text.textContent = question;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ghost cogitoInsertBtn";
      button.dataset.questionIndex = String(index);
      button.textContent = "Insert";
      button.title = "Insert question into markdown";
      item.append(text, button);
      els.cogitoQuestionList.appendChild(item);
    });
  }
  function setCogitoStatus(text) {
    els.cogitoStatus.textContent = text;
  }
  async function getOrCreateEngine() {
    const modelId = selectedModel === "deep" ? DEEP_MODEL : LITE_MODEL;
    if (engineCache[selectedModel]) {
      return engineCache[selectedModel];
    }
    engineCache[selectedModel] = (async () => {
      setCogitoStatus(`Loading ${selectedModel === "deep" ? "Deep (Qwen3 8B)" : "Lite (Llama 1B)"} model...`);
      const webllm = await loadWebLlmModule();
      const engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          if (progress?.text) {
            setCogitoStatus(progress.text);
          }
        }
      });
      return engine;
    })().catch((error) => {
      delete engineCache[selectedModel];
      throw error;
    });
    return engineCache[selectedModel];
  }
  async function generateQuestions() {
    const lastSentence = extractLastSentence(getEditorText());
    if (!lastSentence) {
      setCogitoStatus("Write at least one sentence first, then generate Cogito questions.");
      setStatus("Cogito needs a sentence", "warn");
      return;
    }
    try {
      els.cogitoGenerateBtn.disabled = true;
      setCogitoStatus("Generating 3 questions...");
      const engine = await getOrCreateEngine();
      const completion = await engine.chat.completions.create({
        messages: [
          { role: "system", content: COGITO_PROMPT },
          { role: "user", content: `Last sentence: ${lastSentence}` }
        ],
        temperature: 0.2
      });
      const rawContent = completion.choices?.[0]?.message?.content;
      const textContent = Array.isArray(rawContent) ? rawContent.map((chunk) => typeof chunk === "string" ? chunk : "").join("").trim() : typeof rawContent === "string" ? rawContent.trim() : "";
      if (!textContent) {
        throw new Error("Cogito returned an empty response.");
      }
      generatedQuestions = parseCogitoQuestionPayload(textContent);
      updateQuestionList(generatedQuestions);
      setCogitoStatus("Questions ready. Insert one into your markdown when useful.");
      setStatus("Cogito questions ready", "ok");
    } catch (error) {
      generatedQuestions = [];
      updateQuestionList(generatedQuestions);
      const message = error instanceof Error ? error.message : String(error);
      setCogitoStatus(`Cogito error: ${message}`);
      setStatus("Cogito unavailable", "warn");
      showToast(`Cogito failed: ${message}`, { persist: true });
    } finally {
      els.cogitoGenerateBtn.disabled = false;
    }
  }
  function insertQuestionAtIndex(index) {
    const question = generatedQuestions[index];
    if (!question) {
      showToast("Cogito question not found.", { persist: true });
      return;
    }
    const block = formatCogitoQuestionBlock(question);
    insertTextAtCursor(els.editor, block);
    onEditorContentReplaced(els.editor.value);
    setStatus("Inserted AI question", "ok");
  }
  setPanelVisibility(false);
  return {
    togglePanel: () => {
      setPanelVisibility(!isPanelOpen);
      if (isPanelOpen) {
        setCogitoStatus("Cogito Mode enabled. Generate questions from your last sentence.");
      }
    },
    setPanelOpen: (nextIsOpen) => {
      setPanelVisibility(nextIsOpen);
      if (nextIsOpen) {
        setCogitoStatus("Cogito Mode enabled. Generate questions from your last sentence.");
      }
    },
    isPanelOpen: () => isPanelOpen,
    closePanel: () => {
      setPanelVisibility(false);
    },
    selectModel,
    generateQuestions,
    insertQuestionAtIndex
  };
}
export {
  COGITO_PROMPT,
  DEEP_MODEL,
  LITE_MODEL,
  createCogitoController,
  extractLastSentence,
  formatCogitoQuestionBlock,
  insertTextAtCursor,
  parseCogitoQuestionPayload
};
