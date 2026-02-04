
import { GoogleGenAI, Type } from "@google/genai";
import { ProductionLine } from "../types";

/**
 * Robust call wrapper with exponential backoff and specialized 429 handling.
 */
const callWithRetry = async (fn: () => Promise<any>, maxRetries = 2, initialDelay = 1000) => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 12000))
      ]);
      return result;
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 429;
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * 2;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (error?.message === "TIMEOUT" || i >= maxRetries - 1) break;
      
      const delay = initialDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

/**
 * Heuristic Local Solver: Generates intelligent deployment suggestions when AI is unavailable.
 * Strictly adheres to Continuity (filling gaps) and Productivity (optimizing surplus) principles.
 */
const getFallbackLaborSuggestions = (lineSnapshots: any[]) => {
  const suggestions: any[] = [];
  const tasks = ["TPM", "5S", "On Job Training", "Audit Prep", "Logistic Support"];

  // 1. Identify Deficit Lines (Continuity Principle)
  const deficitLines = lineSnapshots.filter(l => l.present < l.req);
  
  // 2. Identify Donor Pool (Only workers on lines currently ABOVE req)
  // We identify specific worker names available for movement
  let surplusPool: {name: string, fromLine: string, lineName: string}[] = [];
  lineSnapshots.forEach(l => {
    if (l.present > l.req) {
      const surplusCount = l.present - l.req;
      const availableWorkers = l.staffList.slice(-surplusCount);
      availableWorkers.forEach((wName: string) => {
        surplusPool.push({ name: wName, fromLine: l.id, lineName: l.name });
      });
    }
  });

  // 3. PRIORITY 1: Continuity Principle (Mandatory Gap Filling)
  // Fill every deficit line until present == req or surplus pool is empty
  deficitLines.forEach(line => {
    let currentPresent = line.present;
    while (currentPresent < line.req && surplusPool.length > 0) {
      const donor = surplusPool.shift();
      if (!donor) break;
      
      suggestions.push({
        title: `Continuity Principle: Gap Coverage for ${line.name}`,
        description: `CRITICAL: Line ${line.name} is below required manpower (${line.req}). Moving ${donor.name} from ${donor.lineName} to ensure continuity.`,
        executionMetadata: {
          action: "MOVE",
          workerNames: [donor.name],
          fromLine: donor.fromLine,
          toLine: line.id
        }
      });
      currentPresent++;
    }
  });

  // 4. PRIORITY 2: Productivity Principle (Value-Added Reallocation)
  // Only remaining surplusPool workers are assigned to value-add tasks.
  let taskIndex = 0;
  while (surplusPool.length > 0) {
    const groupSize = Math.min(2, surplusPool.length);
    const workers = surplusPool.splice(0, groupSize);
    const selectedTask = tasks[taskIndex % tasks.length];
    
    suggestions.push({
      title: `Productivity Principle: ${selectedTask}`,
      description: `OPTIMIZATION: All lines stabilized. Re-assigning surplus manpower (${workers.map(w => w.name).join(', ')}) to ${selectedTask} for value addition.`,
      executionMetadata: {
        action: "ASSIGN_TASK",
        workerNames: workers.map(w => w.name),
        fromLine: workers[0].fromLine,
        taskCategory: selectedTask
      }
    });
    taskIndex++;
  }

  return { suggestions };
};

export const getLaborRebalancingSuggestion = async (lines: ProductionLine[], eventDetails: string) => {
  const lineSnapshots = lines.map(l => {
    const presentOnLine = [...l.currentWorkers, ...l.buffers].filter(w => w.status === 'Present');
    return {
      id: l.id,
      name: l.name,
      req: l.requiredManpower,
      present: presentOnLine.length,
      staffList: presentOnLine.map(w => w.name)
    };
  });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `YOU ARE: TATA Motors Production Planning Advisor. 
        
        GOAL: Resolve manpower issues using the TATA Two-Tier Principle:
        1. PRIORITY 1 - CONTINUITY PRINCIPLE: Identify lines where 'present' < 'req'. You MUST fill these gaps first by MOVING workers from lines where 'present' > 'req'. 
        2. PRIORITY 2 - PRODUCTIVITY PRINCIPLE: ONLY after all lines have 'present' >= 'req', assign remaining surplus workers to value-add tasks: TPM, 5S, Training, Audit, or Logistics.
        
        CURRENT STATE: ${JSON.stringify(lineSnapshots)}
        SCENARIO: ${eventDetails}
        
        STRICT CONSTRAINTS:
        - NEVER suggest 'ASSIGN_TASK' for a worker if there is still a gap ('present' < 'req') in any other line.
        - Use the line 'id' (e.g., L1, L2) for 'fromLine' and 'toLine'.
        - Use EXACT names from 'staffList'.
        - Group exactly 2 surplus workers for a single 'Productivity' task where possible.
        
        OUTPUT: Return JSON with a 'suggestions' array. Action 'MOVE' for Priority 1, 'ASSIGN_TASK' for Priority 2.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
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
                        taskCategory: { type: Type.STRING }
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

      return JSON.parse(response.text || '{"suggestions": []}');
    });
  } catch (error: any) {
    console.warn("Labor AI Delay. Triggering Heuristic Principle Solver.");
    return getFallbackLaborSuggestions(lineSnapshots);
  }
};
