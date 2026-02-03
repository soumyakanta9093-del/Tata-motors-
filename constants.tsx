
import { ComponentDetail, MachineStatus, ProductionAlert, ProductionLine, Worker, SkillSet, MaintenanceTask } from './types';

export const CSV_DATA: ComponentDetail[] = [
  { ComponentCode: "BAT-2000", ComponentName: "BMS Controller", Module: "Battery System", Model: "Curvv", Plant: "Sanand PV", UoM: "KG", LeadTimeDays: 35, DailyUsageEst: 11, OnHandQty: 194, AllocatedQty: 39, SafetyStock: 119, QualityHoldQty: 6, StdUnitCostINR: 117, InventoryValueINR: 22698, NextReplenishmentETA: "2026-03-08" },
  { ComponentCode: "POW-2001", ComponentName: "Engine Mount Front", Module: "Powertrain", Model: "Altroz", Plant: "Pune-Chakan PV", UoM: "M", LeadTimeDays: 21, DailyUsageEst: 14, OnHandQty: 257, AllocatedQty: 106, SafetyStock: 66, QualityHoldQty: 12, StdUnitCostINR: 18.62, InventoryValueINR: 4785.34, NextReplenishmentETA: "2026-03-02" },
  { ComponentCode: "BRA-2008", ComponentName: "ABS Module", Module: "Braking System", Model: "Nexon", Plant: "Pune-Chakan PV", UoM: "SET", LeadTimeDays: 11, DailyUsageEst: 11, OnHandQty: 124, AllocatedQty: 52, SafetyStock: 150, QualityHoldQty: 8, StdUnitCostINR: 39.93, InventoryValueINR: 4951.32, NextReplenishmentETA: "2026-02-14" },
  { ComponentCode: "EPO-2019", ComponentName: "DC-DC Converter 3kW", Module: "ePowertrain", Model: "Nexon EV", Plant: "Pune-Chakan PV", UoM: "EA", LeadTimeDays: 40, DailyUsageEst: 9, OnHandQty: 266, AllocatedQty: 85, SafetyStock: 132, QualityHoldQty: 6, StdUnitCostINR: 104.4, InventoryValueINR: 27770.4, NextReplenishmentETA: "2026-03-15" }
];

export const MOCK_MACHINES: MachineStatus[] = [
  // BODY SHOP: STAMPING & PRESS (L1)
  { id: 'P01', name: 'Press 2000T-01', lineId: 'L1', status: 'operational', utilization: 92, oee: 88, currentJob: 'CURVV-PNL-A', lastService: '2024-05-10', nextService: '2024-06-10', temp: 42, vibration: 'normal', capacityUnitsHr: 40, currentLoadUnitsHr: 36, isUnderWarranty: true, parallelMachineIds: ['P02'] },
  { id: 'P02', name: 'Press 2000T-02', lineId: 'L1', status: 'operational', utilization: 85, oee: 82, currentJob: 'ALTROZ-PNL-C', lastService: '2024-05-12', nextService: '2024-06-12', temp: 45, vibration: 'normal', capacityUnitsHr: 40, currentLoadUnitsHr: 34, isUnderWarranty: true, parallelMachineIds: ['P01'] },
  { id: 'LC1', name: 'Laser Cutter X1', lineId: 'L1', status: 'operational', utilization: 98, oee: 94, currentJob: 'NEXON-STRUT', lastService: '2024-05-15', nextService: '2024-06-15', temp: 31, vibration: 'normal', capacityUnitsHr: 50, currentLoadUnitsHr: 48, isUnderWarranty: true, parallelMachineIds: ['LC2'] },
  { id: 'LC2', name: 'Laser Cutter X2', lineId: 'L1', status: 'maintenance', utilization: 0, oee: 45, currentJob: 'IDLE', lastService: '2024-05-25', nextService: '2024-06-25', temp: 22, vibration: 'normal', capacityUnitsHr: 50, currentLoadUnitsHr: 0, isUnderWarranty: true, parallelMachineIds: ['LC1'] },

  // BODY SHOP: WELDING (L2)
  { id: 'R01', name: 'Weld Robot A1', lineId: 'L2', status: 'operational', utilization: 94, oee: 91, currentJob: 'CURVV-W-01', lastService: '2024-05-18', nextService: '2024-06-18', temp: 52, vibration: 'normal', capacityUnitsHr: 60, currentLoadUnitsHr: 56, isUnderWarranty: false, parallelMachineIds: ['R03'] },
  { id: 'R02', name: 'Weld Robot A2', lineId: 'L2', status: 'down', utilization: 0, oee: 0, currentJob: 'CURVV-W-02', lastService: '2024-05-22', nextService: '2024-06-22', temp: 74, vibration: 'critical', capacityUnitsHr: 60, currentLoadUnitsHr: 0, isUnderWarranty: true, parallelMachineIds: ['R04'] },
  { id: 'R03', name: 'Weld Robot B1', lineId: 'L2', status: 'operational', utilization: 88, oee: 84, currentJob: 'ALTROZ-W-10', lastService: '2024-05-20', nextService: '2024-06-20', temp: 48, vibration: 'normal', capacityUnitsHr: 60, currentLoadUnitsHr: 52, isUnderWarranty: false, parallelMachineIds: ['R01'] },
  { id: 'R04', name: 'Weld Robot B2', lineId: 'L2', status: 'operational', utilization: 91, oee: 87, currentJob: 'ALTROZ-W-11', lastService: '2024-05-20', nextService: '2024-06-20', temp: 49, vibration: 'elevated', capacityUnitsHr: 60, currentLoadUnitsHr: 54, isUnderWarranty: true, parallelMachineIds: ['R02'] },

  // PAINT SHOP (L3)
  { id: 'PB1', name: 'Paint Booth A', lineId: 'L3', status: 'operational', utilization: 96, oee: 92, currentJob: 'NEXON-RED', lastService: '2024-05-10', nextService: '2024-06-10', temp: 24, vibration: 'normal', capacityUnitsHr: 20, currentLoadUnitsHr: 19, isUnderWarranty: false, parallelMachineIds: ['PB2'] },
  { id: 'PB2', name: 'Paint Booth B', lineId: 'L3', status: 'operational', utilization: 92, oee: 89, currentJob: 'SAFARI-BLK', lastService: '2024-05-15', nextService: '2024-06-15', temp: 24, vibration: 'normal', capacityUnitsHr: 20, currentLoadUnitsHr: 18, isUnderWarranty: false, parallelMachineIds: ['PB1'] },
  { id: 'CD1', name: 'Conveyor Drier', lineId: 'L3', status: 'operational', utilization: 100, oee: 98, currentJob: 'BATCH-404', lastService: '2024-05-01', nextService: '2024-06-01', temp: 120, vibration: 'normal', capacityUnitsHr: 100, currentLoadUnitsHr: 95, isUnderWarranty: false, parallelMachineIds: [] },
  { id: 'PS1', name: 'Polish Station', lineId: 'L3', status: 'operational', utilization: 84, oee: 81, currentJob: 'UNIT-991', lastService: '2024-05-10', nextService: '2024-06-10', temp: 28, vibration: 'normal', capacityUnitsHr: 30, currentLoadUnitsHr: 24, isUnderWarranty: true, parallelMachineIds: [] },

  // GENERAL ASSEMBLY (L4)
  { id: 'AS1', name: 'Engine Marriage', lineId: 'L4', status: 'operational', utilization: 82, oee: 79, currentJob: 'P-112-E', lastService: '2024-05-15', nextService: '2024-06-15', temp: 35, vibration: 'normal', capacityUnitsHr: 30, currentLoadUnitsHr: 24, isUnderWarranty: true, parallelMachineIds: [] },
  { id: 'AS2', name: 'Seat Fitment Bot', lineId: 'L4', status: 'operational', utilization: 95, oee: 92, currentJob: 'NEXON-S-44', lastService: '2024-05-18', nextService: '2024-06-18', temp: 31, vibration: 'normal', capacityUnitsHr: 30, currentLoadUnitsHr: 28, isUnderWarranty: true, parallelMachineIds: [] },
  { id: 'AS3', name: 'Dashboard Set', lineId: 'L4', status: 'operational', utilization: 88, oee: 84, currentJob: 'CURVV-D-01', lastService: '2024-05-20', nextService: '2024-06-20', temp: 33, vibration: 'normal', capacityUnitsHr: 30, currentLoadUnitsHr: 26, isUnderWarranty: true, parallelMachineIds: [] },
  { id: 'AS4', name: 'Glass Inserter', lineId: 'L4', status: 'operational', utilization: 90, oee: 87, currentJob: 'SAFARI-G-09', lastService: '2024-05-20', nextService: '2024-06-20', temp: 29, vibration: 'normal', capacityUnitsHr: 30, currentLoadUnitsHr: 27, isUnderWarranty: true, parallelMachineIds: [] },

  // QUALITY & DIAGNOSTICS (L5)
  { id: 'QC1', name: 'Vision Camera 01', lineId: 'L5', status: 'operational', utilization: 99, oee: 97, currentJob: 'GAP-CHECK', lastService: '2024-05-01', nextService: '2024-06-01', temp: 22, vibration: 'normal', capacityUnitsHr: 200, currentLoadUnitsHr: 195, isUnderWarranty: true, parallelMachineIds: ['QC2'] },
  { id: 'QC2', name: 'Leak Tester', lineId: 'L5', status: 'operational', utilization: 85, oee: 82, currentJob: 'WATER-TEST', lastService: '2024-05-10', nextService: '2024-06-10', temp: 24, vibration: 'normal', capacityUnitsHr: 40, currentLoadUnitsHr: 34, isUnderWarranty: true, parallelMachineIds: ['QC1'] },
  { id: 'QC3', name: 'Dyno Bench', lineId: 'L5', status: 'maintenance', utilization: 0, oee: 0, currentJob: 'IDLE', lastService: '2024-05-25', nextService: '2024-06-25', temp: 25, vibration: 'normal', capacityUnitsHr: 10, currentLoadUnitsHr: 0, isUnderWarranty: true, parallelMachineIds: [] },
  { id: 'QC4', name: 'Alignment Rig', lineId: 'L5', status: 'operational', utilization: 92, oee: 89, currentJob: 'WHEEL-ALIGN', lastService: '2024-05-15', nextService: '2024-06-15', temp: 26, vibration: 'normal', capacityUnitsHr: 30, currentLoadUnitsHr: 27, isUnderWarranty: true, parallelMachineIds: [] },

  // LOGISTICS & AGV
  { id: 'AGV1', name: 'Tugger Bot 01', lineId: 'LOG', status: 'operational', utilization: 88, oee: 85, currentJob: 'BIN-TRANS', lastService: '2024-05-10', nextService: '2024-06-10', temp: 38, vibration: 'normal', capacityUnitsHr: 100, currentLoadUnitsHr: 88, isUnderWarranty: false, parallelMachineIds: ['AGV2'] },
  { id: 'AGV2', name: 'Tugger Bot 02', lineId: 'LOG', status: 'operational', utilization: 90, oee: 87, currentJob: 'TIRE-TRANS', lastService: '2024-05-12', nextService: '2024-06-12', temp: 39, vibration: 'normal', capacityUnitsHr: 100, currentLoadUnitsHr: 90, isUnderWarranty: false, parallelMachineIds: ['AGV1'] },
  { id: 'AGV3', name: 'Lifter Bot 01', lineId: 'LOG', status: 'operational', utilization: 82, oee: 80, currentJob: 'CHASSIS-M', lastService: '2024-05-15', nextService: '2024-06-15', temp: 41, vibration: 'normal', capacityUnitsHr: 50, currentLoadUnitsHr: 41, isUnderWarranty: false, parallelMachineIds: ['AGV4'] },
  { id: 'AGV4', name: 'Lifter Bot 02', lineId: 'LOG', status: 'operational', utilization: 84, oee: 81, currentJob: 'BATT-MOUNT', lastService: '2024-05-15', nextService: '2024-06-15', temp: 40, vibration: 'normal', capacityUnitsHr: 50, currentLoadUnitsHr: 42, isUnderWarranty: false, parallelMachineIds: ['AGV3'] },
];

export const MOCK_MAINTENANCE_TASKS: MaintenanceTask[] = [
  { id: 'T1', machineId: 'R02', type: 'Emergency', status: 'Scheduled', technician: 'S. Kulkarni', plannedStart: '2024-05-26 08:00', estimatedHours: 4 },
];

export const MOCK_ALERTS: ProductionAlert[] = [
  { id: 'A1', type: 'downtime', severity: 'high', message: 'Weld Robot A2 critical motor failure.', timestamp: '10 mins ago' },
];

export const getMasterPool = (): Worker[] => [];
export const getMasterLaborPool = getMasterPool;
export const MOCK_LINES: ProductionLine[] = [];
