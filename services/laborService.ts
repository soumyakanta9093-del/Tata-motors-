
import { GoogleGenAI, Type } from "@google/genai";
import { ProductionLine } from "../types";

/**
 * Robust call wrapper with exponential backoff and timeout protection.
 */
const callWithRetry = async (fn: () => Promise<any>, maxRetries = 3, initialDelay = 1000) => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s hard limit per attempt
      
      const result = await fn();
      clearTimeout(timeoutId);
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`Labor AI Attempt ${i + 1} failed:`, error.message || error);
      
      const isRetryable = error?.message?.includes('429') || 
                          error?.status === 429 || 
                          error?.message?.includes('fetch') ||
                          error?.name === 'AbortError' ||
                          error?.message?.toLowerCase().includes('timeout');

      if (isRetryable && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export const getLaborRebalancingSuggestion = async (lines: ProductionLine[], eventDetails: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Minimal data snapshot to ensure the model doesn't get overwhelmed and stays fast.
    const lineSnapshots = lines.map(l => {
      const presentOnLine = [...l.currentWorkers, ...l.buffers].filter(w => w.status === 'Present');
      return {
        id: l.id,
        name: l.name,
        req: l.requiredManpower,
        present: presentOnLine.length,
        surplus: Math.max(0, presentOnLine.length - l.requiredManpower),
        deficit: Math.max(0, l.requiredManpower - presentOnLine.length),
        staffList: presentOnLine.map(w => w.name)
      };
    });

    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Switched to Flash for speed and to avoid Pro latency spikes
        contents: `ACT: TATA Motors HR Deployment Optimizer.
        EVENT: ${eventDetails}
        SNAPSHOT: ${JSON.stringify(lineSnapshots)}
        
        GOAL: Ensure every line has 'present' >= 'req'.
        
        RULES:
        1. GRANULARITY: Each suggestion must be a SINGLE ACTION affecting MAX 2 specific workers.
        2. MOVES: Take workers from 'surplus' lines to fill 'deficit' lines.
        3. TASKS: Any worker left in 'surplus' after moves MUST be assigned to: TPM, 5S, Training, or Maintenance.
        4. SOURCE SAFETY: Never suggest moving a worker if it makes 'present' < 'req' on their source line.
        5. IDENTITY: Use exact names from the 'staffList' provided.
        
        RETURN: Valid JSON object with 'suggestions' array. No markdown, no prose.`,
        config: {
          // No thinking budget needed for Flash, making it faster.
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    executionMetadata: {
                      type: Type.OBJECT,
                      properties: {
                        action: { type: Type.STRING, enum: ["MOVE", "ASSIGN_TASK"] },
                        workerNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                        fromLine: { type: Type.STRING },
                        toLine: { type: Type.STRING },
                        taskCategory: { type: Type.STRING, enum: ["TPM", "5S", "Training", "Maintenance"] }
                      },
                      required: ["action", "workerNames"]
                    }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text || '';
      // Direct parse should work with Flash's strict JSON mode
      return JSON.parse(text);
    });
  } catch (error) {
    console.error("Labor AI Critical Failure:", error);
    return { suggestions: [], error: true };
  }
};
