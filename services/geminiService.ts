import { GoogleGenAI, Type } from "@google/genai";
import { ServiceSourcingAnalysis, MachineStatus } from "../types";
 
// Standardized call wrapper with retry logic
const callWithRetry = async (fn: () => Promise<any>, maxRetries = 3, initialDelay = 2000) => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};
 
// Primary detailed analysis for machine service sourcing
export const getServiceSourcingAnalysis = async (
  machine: MachineStatus,
  serviceType: 'Regular' | 'Breakdown',
  issueDescription: string,
  allMachines: MachineStatus[]
): Promise<ServiceSourcingAnalysis | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
   
    // Find parallel machines for redistribution
    const parallelCandidates = allMachines.filter(m =>
      machine.parallelMachineIds.includes(m.id) && m.status === 'operational'
    );
 
    const context = `
      TARGET_MACHINE: ${machine.name} (ID: ${machine.id})
      WARRANTY: ${machine.isUnderWarranty ? 'ACTIVE' : 'EXPIRED'}
      CURRENT_LOAD_TO_DISTRIBUTE: ${machine.currentLoadUnitsHr} Jobs/Hr
      CAPACITY_LIMIT: ${machine.capacityUnitsHr} Jobs/Hr
      LINE_ID: ${machine.lineId}
      AVAILABLE_PARALLEL_FLEET: ${JSON.stringify(parallelCandidates.map(p => ({
        id: p.id,
        name: p.name,
        max_capacity_jobs_hr: p.capacityUnitsHr,
        current_load_jobs_hr: p.currentLoadUnitsHr,
        current_utilization: p.utilization
      })))}
    `;
 
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the TATA Motors Industrial Orchestration AI.
        CONTEXT: ${context}
        PROBLEM: ${issueDescription}
        TYPE: ${serviceType}
 
        TASK:
        1. Sourcing: Propose 3 detailed bids for repair.
        2. Load Strategies: Generate FIVE (5) distinct options for re-routing the ${machine.currentLoadUnitsHr} Jobs/Hr:
           - "High-Velocity Bypass": Maximize output (Jobs/Hr) at any cost, using all available parallel capacity.
           - "Preservation Mode": Distribute load to maintain a safe 80% utilization across the fleet to prevent secondary failures.
           - "Throughput Balanced": Aim for the exact line target throughput while minimizing the number of machines involved.
           - "Efficiency Focused": Route Jobs/Hr to the newest machines first (assuming better power-to-job ratio).
           - "Risk Mitigation": Split load equally across the widest possible set of assets.
       
        3. GRANULAR REQUIREMENTS:
           - In 'reasoning' and 'description', explicitly mention the Machine NAMES and IDs being used.
           - In 'steps', specify exactly how many "additionalLoadUnits" (Jobs/Hr) each machine gets.
           - The goal is to keep the Production Rate (Total Line Jobs/Hr) as close to the target as possible.
       
        4. Vendor Choice: Recommend a specific vendor based on cost, timeline, and warranty protection.
 
        Return JSON per the schema provided. Ensure all numerical outputs for throughput are calculated as Jobs/Hr.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topAction: { type: Type.STRING },
              warrantyStatus: { type: Type.STRING, enum: ['Active', 'Expired'] },
              safetyChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
              lineAdjustments: { type: Type.ARRAY, items: { type: Type.STRING } },
              loadBalancingOptions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    strategyName: { type: Type.STRING },
                    description: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    projectedLineOEE: { type: Type.NUMBER },
                    projectedLineThroughput: { type: Type.NUMBER },
                    riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                    steps: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          targetMachineId: { type: Type.STRING },
                          additionalLoadUnits: { type: Type.NUMBER },
                          newUtilization: { type: Type.NUMBER },
                          riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] }
                        }
                      }
                    }
                  }
                }
              },
              technicianOptions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    skillLevel: { type: Type.STRING },
                    specialization: { type: Type.STRING },
                    availability: { type: Type.STRING },
                    hourlyRateINR: { type: Type.NUMBER }
                  }
                }
              },
              vendorEstimates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    vendorName: { type: Type.STRING },
                    repairEstimateINR: { type: Type.NUMBER },
                    warrantyMonths: { type: Type.NUMBER },
                    completionTime: { type: Type.STRING },
                    reputationScore: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    voidsWarranty: { type: Type.BOOLEAN }
                  }
                }
              },
              financialImpact: {
                type: Type.OBJECT,
                properties: {
                  doNothingLossINR: { type: Type.NUMBER },
                  mitigationCostINR: { type: Type.NUMBER },
                  avoidedDowntimeHours: { type: Type.NUMBER }
                }
              },
              aiRecommendation: {
                type: Type.OBJECT,
                properties: {
                  recommendedStrategyIndex: { type: Type.NUMBER },
                  strategyReasoning: { type: Type.STRING },
                  recommendedVendorIndex: { type: Type.NUMBER },
                  vendorReasoning: { type: Type.STRING },
                  totalProjectedCostINR: { type: Type.NUMBER },
                  downtimeRisk: { type: Type.STRING }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  } catch (error) {
    console.error("AI Orchestrator Error:", error);
    return null;
  }
};
 
// Analysis of machine sensors for predictive maintenance
export const getPredictiveMaintenanceAnalysis = async (machine: string, sensors: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze sensors for ${machine}: ${JSON.stringify(sensors)}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};
 
// Strategy for recovering from machine downtime incidents
export const getDowntimeRecoveryAnalysis = async (machine: string, issue: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest recovery for ${machine} failure: ${issue}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};