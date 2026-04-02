import type { DomRefs } from "./types";

export const COGITO_PROMPT = `You are a writing coach.

Rules:
- Do NOT write prose.
- Do NOT suggest sentences.
- Ask exactly 3 questions.
- Questions must be grounded in the user's last sentence.
- Output JSON only in this format:
{
  "questions": ["...", "...", "..."]
}`;

export const LITE_MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
export const DEEP_MODEL = "Qwen3-8B-q4f16_1-MLC";

export type CogitoModel = "lite" | "deep";

type ChatEngine = {
  chat: {
    completions: {
      create: (payload: {
        messages: Array<{ role: "system" | "user"; content: string }>;
        temperature?: number;
      }) => Promise<{ choices?: Array<{ message?: { content?: unknown } }> }>;
    };
  };
};

type WebLlmModule = {
  CreateMLCEngine: (
    modelId: string,
    options?: {
      initProgressCallback?: (progress: { text?: string }) => void;
    },
  ) => Promise<ChatEngine>;
};

type ToastFn = (message: string, options?: { persist?: boolean }) => void;

type SetStatusFn = (message: string, kind?: "ok" | "warn" | "err") => void;

type CogitoController = {
  togglePanel: () => void;
  selectModel: (model: CogitoModel) => void;
  generateQuestions: () => Promise<void>;
  insertQuestionAtIndex: (index: number) => void;
};

export function extractLastSentence(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const fragments = normalized
    .split(/(?<=[.!?])\s+/)
    .map((fragment) => fragment.trim())
    .filter(Boolean);

  if (fragments.length === 0) {
    return "";
  }

  return fragments[fragments.length - 1];
}

export function parseCogitoQuestionPayload(raw: string): string[] {
  const jsonText = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const parsed = JSON.parse(jsonText) as { questions?: unknown };

  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error("Cogito response did not include a questions array.");
  }

  const sanitized = parsed.questions
    .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
    .map((q) => q.trim());

  if (sanitized.length === 0) {
    throw new Error("Cogito response contained no valid questions.");
  }

  if (sanitized.length !== 3) {
    throw new Error("Cogito response must contain exactly 3 questions.");
  }

  return sanitized;
}

export function formatCogitoQuestionBlock(question: string): string {
  return `> ### AI\n${question.trim()}\n`;
}

export function insertTextAtCursor(textarea: HTMLTextAreaElement, text: string): void {
  const { selectionStart, selectionEnd, value } = textarea;
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  textarea.value = `${before}${text}${after}`;
  const nextCursor = before.length + text.length;
  textarea.setSelectionRange(nextCursor, nextCursor);
}

export function createCogitoController({
  els,
  getEditorText,
  onEditorContentReplaced,
  showToast,
  setStatus,
}: {
  els: DomRefs;
  getEditorText: () => string;
  onEditorContentReplaced: (text: string) => void;
  showToast: ToastFn;
  setStatus: SetStatusFn;
}): CogitoController {
  let isPanelOpen = false;
  let generatedQuestions: string[] = [];
  let selectedModel: CogitoModel = "lite";
  const engineCache: Partial<Record<CogitoModel, Promise<ChatEngine>>> = {};

  async function loadWebLlmModule(): Promise<WebLlmModule> {
    const testModule = (
      globalThis as typeof globalThis & {
        __INK_TEST_WEBLLM__?: WebLlmModule;
      }
    ).__INK_TEST_WEBLLM__;

    if (testModule) {
      return testModule;
    }

    return import("https://esm.run/@mlc-ai/web-llm") as Promise<WebLlmModule>;
  }

  function selectModel(model: CogitoModel): void {
    selectedModel = model;
    els.cogitoLiteBtn.classList.toggle("active", model === "lite");
    els.cogitoDeepBtn.classList.toggle("active", model === "deep");
  }

  function setPanelVisibility(isOpen: boolean): void {
    isPanelOpen = isOpen;
    els.cogitoPanel.hidden = !isOpen;
    els.cogitoToggleBtn.setAttribute("aria-expanded", String(isOpen));
    const split = els.cogitoPanel.closest(".split");
    if (split) {
      split.classList.toggle("with-cogito", isOpen);
    }
  }

  function updateQuestionList(questions: string[]): void {
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

  function setCogitoStatus(text: string): void {
    els.cogitoStatus.textContent = text;
  }

  async function getOrCreateEngine(): Promise<ChatEngine> {
    const modelId = selectedModel === "deep" ? DEEP_MODEL : LITE_MODEL;

    if (engineCache[selectedModel]) {
      return engineCache[selectedModel]!;
    }

    engineCache[selectedModel] = (async () => {
      setCogitoStatus(`Loading ${selectedModel === "deep" ? "Deep (Qwen3 8B)" : "Lite (Llama 1B)"} model...`);
      const webllm = await loadWebLlmModule();
      const engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (progress: { text?: string }) => {
          if (progress?.text) {
            setCogitoStatus(progress.text);
          }
        },
      });
      return engine as ChatEngine;
    })().catch((error: unknown) => {
      delete engineCache[selectedModel];
      throw error;
    });

    return engineCache[selectedModel]!;
  }

  async function generateQuestions(): Promise<void> {
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
          { role: "user", content: `Last sentence: ${lastSentence}` },
        ],
        temperature: 0.2,
      });

      const rawContent = completion.choices?.[0]?.message?.content;
      const textContent = Array.isArray(rawContent)
        ? rawContent
            .map((chunk) => (typeof chunk === "string" ? chunk : ""))
            .join("")
            .trim()
        : typeof rawContent === "string"
          ? rawContent.trim()
          : "";

      if (!textContent) {
        throw new Error("Cogito returned an empty response.");
      }

      generatedQuestions = parseCogitoQuestionPayload(textContent);
      updateQuestionList(generatedQuestions);
      setCogitoStatus("Questions ready. Insert one into your markdown when useful.");
      setStatus("Cogito questions ready", "ok");
    } catch (error: unknown) {
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

  function insertQuestionAtIndex(index: number): void {
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
    selectModel,
    generateQuestions,
    insertQuestionAtIndex,
  };
}
