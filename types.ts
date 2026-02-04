
export type Language = 'EN' | 'DE';

export interface ComponentDetail {
  ComponentCode: string;
  ComponentName: string;
  Module: string;
  Model: string;
  Plant: string;
  UoM: string;
  LeadTimeDays: number;
  DailyUsageEst: number;
  OnHandQty: number;
  AllocatedQty: number;
  SafetyStock: number;
  QualityHoldQty: number;
  StdUnitCostINR: number;
  InventoryValueINR: number;
  NextReplenishmentETA: string;
}

export interface MachineStatus {
  id: string;
  name: string;
  lineId: string;
  status: 'operational' | 'down' | 'maintenance';
  currentJob?: string;
  utilization: number;
  oee: number;
  lastService: string;
  nextService: string;
  temp: number;
  vibration: 'normal' | 'elevated' | 'critical';
  // New properties for load allocation
  capacityUnitsHr: number;
  currentLoadUnitsHr: number;
  isUnderWarranty: boolean;
  parallelMachineIds: string[];
  // Tracking live service progress
  serviceStage?: 'Dispatched' | 'Technician Assigned' | 'Diagnosis' | 'In Progress' | 'Quality Check' | 'Restored';
}

export interface RedistributionStep {
  targetMachineId: string;
  additionalLoadUnits: number;
  newUtilization: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface LoadBalancingOption {
  strategyName: string;
  description: string;
  reasoning: string;
  projectedLineOEE: number;
  projectedLineThroughput: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  steps: RedistributionStep[];
}

export interface ServiceSourcingAnalysis {
  machineName: string;
  serviceType: 'Regular' | 'Breakdown';
  topAction: string;
  warrantyStatus: 'Active' | 'Expired';
  safetyChecklist: string[];
  lineAdjustments: string[];
  loadBalancingOptions: LoadBalancingOption[];
  technicianOptions: Array<{
    id: string;
    name: string;
    skillLevel: string;
    specialization: string;
    availability: string;
    hourlyRateINR: number;
  }>;
  vendorEstimates: Array<{
    vendorName: string;
    repairEstimateINR: number;
    warrantyMonths: number;
    completionTime: string;
    reputationScore: number;
    description: string;
    voidsWarranty: boolean;
  }>;
  financialImpact: {
    doNothingLossINR: number;
    mitigationCostINR: number;
    avoidedDowntimeHours: number;
  };
  aiRecommendation: {
    recommendedStrategyIndex: number;
    strategyReasoning: string;
    recommendedVendorIndex: number;
    vendorReasoning: string;
    totalProjectedCostINR: number;
    downtimeRisk: 'Low' | 'Medium' | 'High';
  };
}

export interface MaintenanceTask {
  id: string;
  machineId: string;
  type: 'Preventive' | 'TPM' | 'Emergency' | 'Audit';
  status: 'Scheduled' | 'In Progress' | 'Completed';
  technician: string;
  plannedStart: string;
  estimatedHours: number;
}

export interface ProductionAlert {
  id: string;
  type: 'downtime' | 'material' | 'labor' | 'priority' | 'quality' | 'maintenance';
  severity: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
}

export type OptimizationObjective = 'cost' | 'profit' | 'efficiency';

export enum DashboardTab {
  MANAGEMENT = 'management',
  OPERATIONS = 'operations',
  EXECUTION = 'execution',
  PLANNING = 'planning',
  MATERIALS = 'materials',
  LABOR = 'labor',
  MACHINE = 'machine',
  ADMIN = 'admin',
  REPORTS = 'reports'
}

export type SkillSet = 'Assembly' | 'Welding' | 'Quality Control' | 'Maintenance' | '5S' | 'Logistics' | 'Electronics';

export interface Worker {
  id: string;
  name: string;
  skills: SkillSet[];
  status: 'Present' | 'Absent' | 'On Leave' | 'Emergency' | 'Maintenance' | 'TPM' | '5S' | 'Training' | 'Audit Prep' | 'Support';
  type: 'Main' | 'Buffer';
  assignedLine: string;
  shift: 'A' | 'B' | 'C';
}

export interface ProductionLine {
  id: string;
  name: string;
  taktTime: number; 
  requiredManpower: number;
  currentWorkers: Worker[];
  buffers: Worker[];
}

export interface PlantConfig {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  shiftTimings: {
    morning: string;
    evening: string;
    night: string;
  };
}

export interface AppUser {
  id: string;
  name: string;
  role: string;
  email: string;
}
