
import { GoogleGenAI, Type } from "@google/genai";
import { ComponentDetail } from "../types";

export const getMaterialOptimizationSuggestion = async (data: ComponentDetail[], context: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze Material State: ${context}. Data: ${JSON.stringify(data.slice(0, 10))}`,
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
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Material AI Error:", error);
    return null;
  }
};

export const getDemandSurgeAnalysis = async (model: string, magnitude: number, data: ComponentDetail[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Demand surge of ${magnitude}% for ${model}. Analyze inventory impact.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};

export const getLogisticsDisruptionAnalysis = async (details: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Logistics disruption: ${JSON.stringify(details)}. Suggest mitigation.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};
