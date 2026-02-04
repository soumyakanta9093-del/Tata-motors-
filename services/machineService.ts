 
import { GoogleGenAI, Type } from "@google/genai";
 
export const getPredictiveMaintenanceAnalysis = async (machine: string, sensors: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze sensors for ${machine}: ${JSON.stringify(sensors)}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};
 
export const getDowntimeRecoveryAnalysis = async (machine: string, issue: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest recovery for ${machine} failure: ${issue}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};
 
export const getServiceSourcingAnalysis = async (machine: string, type: string, details: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Source service for ${machine} (${type}): ${details}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};
 
 