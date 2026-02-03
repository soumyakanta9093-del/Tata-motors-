
import { GoogleGenAI, Type } from "@google/genai";
import { ServiceSourcingAnalysis, MachineStatus } from "../types";

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
      MACHINE: ${machine.name} (ID: ${machine.id})
      WARRANTY: ${machine.isUnderWarranty ? 'ACTIVE' : 'EXPIRED'}
      CURRENT_LOAD: ${machine.currentLoadUnitsHr} Units/Hr
      LINE_ID: ${machine.lineId}
      PARALLEL_FLEET: ${JSON.stringify(parallelCandidates.map(p => ({ id: p.id, name: p.name, cap: p.capacityUnitsHr, load: p.currentLoadUnitsHr })))}
    `;

    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the TATA Motors Industrial Orchestration AI.
        CONTEXT: ${context}
        PROBLEM: ${issueDescription}
        TYPE: ${serviceType}

        TASK:
        1. Sourcing: Propose 3 detailed bids.
        2. Load Strategies: Generate FIVE (5) distinct options for re-routing the ${machine.currentLoadUnitsHr} units/hr:
           - "Aggressive Recovery": Minimize throughput loss, accept >95% utilization.
           - "Balanced Health": Maintain 85-90% utilization to protect parallel machine lifespan.
           - "Quality First": Reduce throughput to ensure zero defects on stressed assets.
           - "Energy Optimized": Route load to the most energy-efficient active machines.
           - "Service Clustering": Shift load to machines with the longest time remaining until their next service.
        3. Reasoning: For each strategy, explain exactly WHY these parallel machines were chosen and the technical trade-offs.
        4. Vendor Choice: Recommend a specific vendor and provide a 'vendorReasoning' field explaining the decision based on cost, timeline, and warranty protection.

        Return JSON per the schema provided.`,
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
