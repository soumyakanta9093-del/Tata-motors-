
import { GoogleGenAI, Type } from "@google/genai";

export const getReplanningSuggestion = async (constraint: string, details: string, objective: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Replan production mix for ${constraint} objective: ${objective}. Details: ${details}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};
