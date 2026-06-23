// src/app/cogito.ts
var COGITO_PROMPT = `You are a writing coach.

Rules:
- Do NOT write prose.
- Do NOT suggest sentences.
- Ask exactly 3 questions.
- Questions must be grounded in the user's last sentence.
- Use document analysis only to focus what the questions explore.
- Output JSON only in this format:
{
  "questions": ["...", "...", "..."]
}`;
var LITE_MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
var DEEP_MODEL = "Qwen3-8B-q4f16_1-MLC";
var MAX_LAST_SENTENCE_CONTEXT_LENGTH = 1200;
var MAX_ANALYSIS_LINE_LENGTH = 240;
var MODEL_LOAD_RETRY_DELAY_MS = 750;
function compactContextLine(value, maximumLength, keepEnd = false) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maximumLength) {
    return normalized;
  }
  if (keepEnd) {
    return `\u2026${normalized.slice(-(maximumLength - 1))}`;
  }
  return `${normalized.slice(0, maximumLength - 1)}\u2026`;
}
function isRecoverableModelLoadError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /cache|network|fetch|failed to execute ['"]?add|load failed|connection/i.test(message);
}
function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
function buildCogitoAnalysisContext(analysis) {
  if (!analysis) {
    return null;
  }
  return {
    overallScore: analysis.overallScore,
    priorities: analysis.overview.priorities.slice(0, 3).map((line) => compactContextLine(line, MAX_ANALYSIS_LINE_LENGTH)),
    strengths: analysis.overview.strengths.slice(0, 2).map((line) => compactContextLine(line, MAX_ANALYSIS_LINE_LENGTH))
  };
}
function buildCogitoUserPrompt(lastSentence, analysisContext) {
  const compactLastSentence = compactContextLine(
    lastSentence,
    MAX_LAST_SENTENCE_CONTEXT_LENGTH,
    true
  );
  const lines = [`Last sentence: ${compactLastSentence}`];
  if (!analysisContext) {
    lines.push("Document analysis: unavailable. Focus only on the last sentence.");
    return lines.join("\n");
  }
  const compactPriorities = analysisContext.priorities.slice(0, 3).map((line) => compactContextLine(line, MAX_ANALYSIS_LINE_LENGTH));
  const compactStrengths = analysisContext.strengths.slice(0, 2).map((line) => compactContextLine(line, MAX_ANALYSIS_LINE_LENGTH));
  lines.push(
    `Document strength: ${analysisContext.overallScore}/100`,
    `Highest-priority improvements: ${compactPriorities.join(" | ") || "No major fixes identified."}`,
    `Current strengths: ${compactStrengths.join(" | ") || "No clear strengths identified yet."}`
  );
  return lines.join("\n");
}
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
  setStatus,
  getDocumentAnalysis,
  getAnalysisRevision
}) {
  let isPanelOpen = false;
  let generatedQuestions = [];
  let selectedModel = "lite";
  let generatedAnalysisRevision = null;
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
  function getModelId(model) {
    return model === "deep" ? DEEP_MODEL : LITE_MODEL;
  }
  function getModelLabel(model) {
    return model === "deep" ? "Deep (Qwen3 8B)" : "Lite (Llama 1B)";
  }
  async function createEngineWithRecovery(model) {
    const modelId = getModelId(model);
    const webllm = await loadWebLlmModule();
    const appConfig = {
      ...webllm.prebuiltAppConfig,
      cacheBackend: "indexeddb"
    };
    async function createEngine() {
      return webllm.CreateMLCEngine(modelId, {
        appConfig,
        initProgressCallback: (progress) => {
          if (progress?.text) {
            setCogitoStatus(progress.text);
          }
        }
      });
    }
    try {
      return await createEngine();
    } catch (error) {
      if (!isRecoverableModelLoadError(error)) {
        throw error;
      }
      setCogitoStatus(`Repairing ${getModelLabel(model)} cache and retrying...`);
      try {
        await webllm.deleteModelAllInfoInCache?.(modelId, appConfig);
      } catch {
      }
      await wait(MODEL_LOAD_RETRY_DELAY_MS);
      return createEngine();
    }
  }
  async function getOrCreateEngine(model = selectedModel) {
    if (engineCache[model]) {
      return engineCache[model];
    }
    setCogitoStatus(`Loading ${getModelLabel(model)} model...`);
    engineCache[model] = createEngineWithRecovery(model).catch((error) => {
      delete engineCache[model];
      throw error;
    });
    return engineCache[model];
  }
  async function getEngineWithFallback() {
    try {
      return await getOrCreateEngine(selectedModel);
    } catch (error) {
      if (selectedModel !== "deep" || !isRecoverableModelLoadError(error)) {
        throw error;
      }
      setCogitoStatus("Deep model download failed. Falling back to Lite...");
      selectModel("lite");
      return getOrCreateEngine("lite");
    }
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
      const engine = await getEngineWithFallback();
      const analysisContext = buildCogitoAnalysisContext(getDocumentAnalysis());
      const analysisRevision = getAnalysisRevision();
      const completion = await engine.chat.completions.create({
        messages: [
          { role: "system", content: COGITO_PROMPT },
          { role: "user", content: buildCogitoUserPrompt(lastSentence, analysisContext) }
        ],
        temperature: 0.2
      });
      const rawContent = completion.choices?.[0]?.message?.content;
      const textContent = Array.isArray(rawContent) ? rawContent.map((chunk) => typeof chunk === "string" ? chunk : "").join("").trim() : typeof rawContent === "string" ? rawContent.trim() : "";
      if (!textContent) {
        throw new Error("Cogito returned an empty response.");
      }
      generatedQuestions = parseCogitoQuestionPayload(textContent);
      generatedAnalysisRevision = analysisContext ? analysisRevision : null;
      updateQuestionList(generatedQuestions);
      setCogitoStatus(
        analysisContext ? "Questions ready and focused by the current document analysis." : "Questions ready. Analyze the document for more focused coaching."
      );
      setStatus("Cogito questions ready", "ok");
    } catch (error) {
      generatedQuestions = [];
      updateQuestionList(generatedQuestions);
      const message = error instanceof Error ? error.message : String(error);
      const friendlyMessage = isRecoverableModelLoadError(error) ? "The local model could not finish downloading. Check the connection and available browser storage, then retry." : message;
      setCogitoStatus(`Cogito error: ${friendlyMessage}`);
      setStatus("Cogito unavailable", "warn");
      showToast(`Cogito failed: ${friendlyMessage}`, { persist: true });
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
  function markAnalysisChanged(revision) {
    if (generatedQuestions.length === 0 || generatedAnalysisRevision === revision) {
      return;
    }
    setCogitoStatus("Document analysis changed. Regenerate to focus these questions on the latest findings.");
  }
  setPanelVisibility(false);
  return {
    togglePanel: () => {
      setPanelVisibility(!isPanelOpen);
      if (isPanelOpen) {
        setCogitoStatus(
          getDocumentAnalysis() ? "Generate questions focused by the current document analysis." : "Analyze first for more focused coaching, or generate from your latest sentence now."
        );
      }
    },
    setPanelOpen: (nextIsOpen) => {
      setPanelVisibility(nextIsOpen);
      if (nextIsOpen) {
        setCogitoStatus(
          getDocumentAnalysis() ? "Generate questions focused by the current document analysis." : "Analyze first for more focused coaching, or generate from your latest sentence now."
        );
      }
    },
    isPanelOpen: () => isPanelOpen,
    closePanel: () => {
      setPanelVisibility(false);
    },
    selectModel,
    generateQuestions,
    insertQuestionAtIndex,
    markAnalysisChanged
  };
}
export {
  COGITO_PROMPT,
  DEEP_MODEL,
  LITE_MODEL,
  buildCogitoAnalysisContext,
  buildCogitoUserPrompt,
  createCogitoController,
  extractLastSentence,
  formatCogitoQuestionBlock,
  insertTextAtCursor,
  isRecoverableModelLoadError,
  parseCogitoQuestionPayload
};
