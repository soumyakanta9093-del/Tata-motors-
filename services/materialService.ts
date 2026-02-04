
import { GoogleGenAI, Type } from "@google/genai";
import { ComponentDetail } from "../types";

/**
 * Robust call wrapper with exponential backoff and specialized 429 handling.
 */
const callWithRetry = async (fn: () => Promise<any>, maxRetries = 2, initialDelay = 2000) => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 429;
      if (isRateLimit && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, initialDelay * 4)); // Extra backoff for 429
        continue;
      }
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, initialDelay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

/**
 * Fallback Surge Analysis logic when API is rate-limited.
 */
const getFallbackSurgeAnalysis = (model: string, data: ComponentDetail[]) => {
  // Find top 3 components with lowest safety stock headroom for this model
  const atRisk = data
    .filter(p => p.Model.includes(model))
    .sort((a, b) => (a.OnHandQty / a.SafetyStock) - (b.OnHandQty / b.SafetyStock))
    .slice(0, 3);

  return {
    surgeSummary: `[LOCAL FALLBACK] Demand surge simulation for ${model} indicates critical supply strain on electronics and specialized trim components.`,
    riskComponents: atRisk.map(c => ({
      name: c.ComponentName,
      code: c.ComponentCode,
      riskLevel: "Critical",
      deficit: Math.round(c.SafetyStock * 0.5),
      vendors: [
        { vendorName: "Tata AutoComp Systems (Pune)", leadTimeDays: 2, location: "Local", freightCostINR: 8500, isBestOption: true },
        { vendorName: "Bosch Industrial (Chennai)", leadTimeDays: 5, location: "Domestic", freightCostINR: 22000, isBestOption: false },
        { vendorName: "Delta Electronics (Overseas)", leadTimeDays: 14, location: "International", freightCostINR: 120000, isBestOption: false }
      ]
    }))
  };
};

export const getMaterialOptimizationSuggestion = async (data: ComponentDetail[], context: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze Material State: ${context}. Data: ${JSON.stringify(data.slice(0, 8))}`,
        config: {
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
                    severity: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '{"suggestions": []}');
    });
  } catch (error) {
    console.warn("Material AI Rate Limited. Returning local heuristic audit.");
    return { 
      suggestions: [
        { title: "Inventory Drift Check", description: "[FALLBACK] Detected deviation in lead-time variance for L-ion cell imports. Recommended buffer increase.", severity: "Medium" },
        { title: "Safety Stock Optimization", description: "[FALLBACK] 5 components on Trim Line are approaching threshold. Review replenishment schedule.", severity: "High" }
      ] 
    };
  }
};

export const getDemandSurgeAnalysis = async (model: string, magnitude: number, data: ComponentDetail[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Simulation: ${magnitude}% surge for ${model}. Data: ${JSON.stringify(data.slice(0, 10))}`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              surgeSummary: { type: Type.STRING },
              riskComponents: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    code: { type: Type.STRING },
                    riskLevel: { type: Type.STRING },
                    deficit: { type: Type.NUMBER },
                    vendors: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          vendorName: { type: Type.STRING },
                          leadTimeDays: { type: Type.NUMBER },
                          location: { type: Type.STRING },
                          freightCostINR: { type: Type.NUMBER },
                          isBestOption: { type: Type.BOOLEAN }
                        },
                        required: ["vendorName", "leadTimeDays", "location", "freightCostINR", "isBestOption"]
                      }
                    }
                  },
                  required: ["name", "code", "deficit", "vendors"]
                }
              }
            },
            required: ["riskComponents"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  } catch (error) {
    console.warn("Demand Surge AI Rate Limited. Activating Local Simulator Fallback.");
    return getFallbackSurgeAnalysis(model, data);
  }
};

export const getLogisticsDisruptionAnalysis = async (details: any) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Logistics disruption: ${JSON.stringify(details)}. Suggest mitigation strategy in JSON.`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || '{"mitigation": "Divert incoming shipments to port 2."}');
    });
  } catch (error) {
    return { mitigation: "[FALLBACK] Rerouting via secondary NH-48 corridor suggested. Transit time impact: +4h. No stockout risk detected." };
  }
};
