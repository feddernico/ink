import type { DomRefs } from "./types";

type ToastFn = (message: string, options?: { persist?: boolean }) => void;
type SetStatusFn = (message: string, kind?: "ok" | "warn" | "err") => void;

type DocumentLinterController = {
  togglePanel: () => void;
  analyzeDocument: () => Promise<void>;
  exportSuggestions: () => void;
};

export function createDocumentLinterController({
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
}): DocumentLinterController {
  let isPanelOpen = false;
  let isAnalyzing = false;
  
  // Rule-based analysis functions
  function analyzeReadability(text: string): { score: number; suggestions: string[] } {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const longSentences = sentences.filter(s => s.trim().length > 20);
    const score = Math.max(0, 100 - (longSentences.length * 10));
    const suggestions = [];
    
    if (longSentences.length > 0) {
      suggestions.push(`Found ${longSentences.length} sentence(s) that may be too long (over 20 characters). Consider breaking them up for better readability.`);
    }
    
    return { score, suggestions };
  }
  
  function analyzeSkimmability(text: string): { score: number; suggestions: string[] } {
    const lines = text.split('\n');
    const headingLines = lines.filter(line => line.startsWith('#'));
    const bulletLines = lines.filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const longParagraphs = paragraphs.filter(p => p.split(' ').length > 100);
    
    let score = 100;
    if (headingLines.length === 0) score -= 20;
    if (bulletLines.length === 0 && paragraphs.length > 3) score -= 10;
    if (longParagraphs.length > 0) score -= longParagraphs.length * 15;
    score = Math.max(0, score);
    
    const suggestions = [];
    if (headingLines.length === 0) {
      suggestions.push("No headings found. Adding headings improves document structure and skimmability.");
    }
    if (longParagraphs.length > 0) {
      suggestions.push(`Found ${longParagraphs.length} paragraph(s) that may be too long for easy scanning. Consider breaking them up.`);
    }
    
    return { score, suggestions };
  }
  
  function analyzeEngagement(text: string): { score: number; suggestions: string[] } {
    const lines = text.split('\n');
    const firstLine = lines[0] || '';
    const hasQuotes = text.includes('"') || text.includes("'");
    const hasLinks = text.includes('http://') || text.includes('https://') || text.includes('[ ');
    const words = text.match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const vocabularyRichness = uniqueWords / Math.max(words.length, 1);
    
    let score = 50; // Base score
    if (firstLine.startsWith('#')) score += 20; // Has title heading
    if (hasQuotes) score += 15;
    if (hasLinks) score += 15;
    if (vocabularyRichness > 0.5) score += 20;
    score = Math.min(100, score);
    
    const suggestions = [];
    if (!firstLine.startsWith('#')) {
      suggestions.push("Consider starting with a clear title heading to improve engagement.");
    }
    if (!hasQuotes && !hasLinks) {
      suggestions.push("Adding quotes or links can increase engagement and provide supporting evidence.");
    }
    if (vocabularyRichness < 0.3) {
      suggestions.push("Consider varying your word choice to improve vocabulary richness.");
    }
    
    return { score, suggestions };
  }
  
  function analyzeStyle(text: string): { score: number; suggestions: string[] } {
    // Simple style checks
    const passiveVoiceMatches = text.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || [];
    const longWords = text.match(/\b\w{12,}\b/g) || [];
    
    let score = 100;
    if (passiveVoiceMatches.length > 0) score -= passiveVoiceMatches.length * 5;
    if (longWords.length > 0) score -= longWords.length * 3;
    score = Math.max(0, score);
    
    const suggestions = [];
    if (passiveVoiceMatches.length > 0) {
      suggestions.push(`Found ${passiveVoiceMatches.length} potential passive voice construction(s). Consider using active voice for clearer writing.`);
    }
    if (longWords.length > 0) {
      suggestions.push(`Found ${longWords.length} unusually long word(s). Consider using simpler alternatives for better readability.`);
    }
    
    return { score, suggestions };
  }
  
  function analyzeDocumentStructure(text: string): { score: number; suggestions: string[] } {
    const lines = text.split('\n');
    let headingLevel = 0;
    let maxJump = 0;
    let inCodeBlock = false;
    
    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      if (inCodeBlock) continue;
      
      const headingMatch = line.match(/^(#+)\s+/);
      if (headingMatch) {
        const currentLevel = headingMatch[1].length;
        if (headingLevel > 0) {
          const jump = Math.abs(currentLevel - headingLevel);
          maxJump = Math.max(maxJump, jump);
        }
        headingLevel = currentLevel;
      }
    }
    
    let score = 100;
    if (maxJump > 2) score -= (maxJump - 2) * 15;
    score = Math.max(0, score);
    
    const suggestions = [];
     if (maxJump > 2) {
       suggestions.push(`Found heading level jumps of more than 2 levels. Maintaining a consistent heading hierarchy improves document structure.`);
     }
    
    return { score, suggestions };
  }
  
  function analyzeDocument(): Promise<{ 
    readability: { score: number; suggestions: string[] };
    skimmability: { score: number; suggestions: string[] };
    engagement: { score: number; suggestions: string[] };
    style: { score: number; suggestions: string[] };
    structure: { score: number; suggestions: string[] };
  }> {
    return new Promise((resolve) => {
      // Simulate async analysis
      setTimeout(() => {
        const text = getEditorText();
        resolve({
          readability: analyzeReadability(text),
          skimmability: analyzeSkimmability(text),
          engagement: analyzeEngagement(text),
          style: analyzeStyle(text),
          structure: analyzeDocumentStructure(text)
        });
      }, 100);
    });
  }
  
  function setPanelVisibility(isOpen: boolean): void {
    isPanelOpen = isOpen;
    els.documentLinterPanel.hidden = !isOpen;
    els.documentLinterToggleBtn.setAttribute("aria-expanded", String(isOpen));
    const split = els.documentLinterPanel.closest(".split");
    if (split) {
      split.classList.toggle("with-document-linter", isOpen);
    }
  }
  
  function updateResultsPanel(results: {
    readability: { score: number; suggestions: string[] };
    skimmability: { score: number; suggestions: string[] };
    engagement: { score: number; suggestions: string[] };
    style: { score: number; suggestions: string[] };
    structure: { score: number; suggestions: string[] };
  }): void {
    const resultsContainer = els.documentLinterResults;
    resultsContainer.innerHTML = '';
    
    const categories = [
      { name: 'Readability', id: 'readability', color: '#4CAF50' },
      { name: 'Skimmability', id: 'skimmability', color: '#2196F3' },
      { name: 'Engagement', id: 'engagement', color: '#FF9800' },
      { name: 'Style', id: 'style', color: '#9C27B0' },
      { name: 'Structure', id: 'structure', color: '#607D8B' }
    ];
    
    categories.forEach(category => {
      const result = results[category.id as keyof typeof results];
      const categoryElement = document.createElement('div');
      categoryElement.className = 'document-linter-category';
      categoryElement.innerHTML = `
        <div class="document-linter-category-header" style="border-left: 4px solid ${category.color};">
          <h3>${category.name}</h3>
          <div class="document-linter-score">${result.score}/100</div>
        </div>
        <div class="document-linter-suggestions">
          ${result.suggestions.map(s => `<div class="document-linter-suggestion">• ${s}</div>`).join('')}
        </div>
      `;
      resultsContainer.appendChild(categoryElement);
    });
  }
  
  async function analyzeDocumentAction(): Promise<void> {
    if (isAnalyzing) return;
    
    isAnalyzing = true;
    els.documentLinterAnalyzeBtn.disabled = true;
    els.documentLinterStatus.textContent = 'Analyzing document...';
    
    try {
      const results = await analyzeDocument();
      updateResultsPanel(results);
      els.documentLinterStatus.textContent = 'Analysis complete';
      showToast('Document analysis completed', { persist: false });
    } catch (error) {
      els.documentLinterStatus.textContent = 'Analysis failed';
      showToast(`Document analysis failed: ${String(error)}`, { persist: true });
    } finally {
      isAnalyzing = false;
      els.documentLinterAnalyzeBtn.disabled = false;
    }
  }
  
  function exportSuggestionsAction(): void {
    const text = getEditorText();
    if (!text.trim()) {
      showToast('No content to analyze', { persist: true });
      return;
    }
    
    // In a real implementation, this would generate a detailed markdown report
    showToast('Export functionality would generate a markdown report with detailed suggestions', { persist: true });
  }
  
  setPanelVisibility(false);
  
  return {
    togglePanel: () => {
      setPanelVisibility(!isPanelOpen);
      if (isPanelOpen) {
        els.documentLinterStatus.textContent = 'Ready to analyze document';
      }
    },
    analyzeDocument: analyzeDocumentAction,
    exportSuggestions: exportSuggestionsAction
  };
}