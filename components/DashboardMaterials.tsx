
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { CSV_DATA } from '../constants';
import { getMaterialOptimizationSuggestion, getDemandSurgeAnalysis } from '../services/materialService';
import { 
  Search, Factory, ShieldCheck, 
  RefreshCcw, Warehouse, ClipboardList, Sparkles,
  TrendingUp, AlertTriangle, CheckCircle, 
  ChevronRight, X, Zap, Loader2, Package, 
  CheckCircle2, ShoppingCart, Database,
  Shield, ArrowUpCircle, ChevronLeft
} from 'lucide-react';

const ITEMS_PER_PAGE = 5;

const DashboardMaterials: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [surgeLoading, setSurgeLoading] = useState(false);
  const [surgeResult, setSurgeResult] = useState<any>(null);
  const [showSurgeModal, setShowSurgeModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [surgeModel, setSurgeModel] = useState('Nexon');
  const [surgeMagnitude, setSurgeMagnitude] = useState(45);
  
  // Initial System Sync State
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [initialSyncProgress, setInitialSyncProgress] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Track executed POs in the surge simulation
  const [executedPOs, setExecutedPOs] = useState<Set<string>>(new Set());
  // Track replenished SKUs in the audit modal
  const [replenishedSKUs, setReplenishedSKUs] = useState<Set<string>>(new Set());

  // Sync states for Demand Surge Analysis
  const [surgeSyncing, setSurgeSyncing] = useState(false);
  const [surgeSyncProgress, setSurgeSyncProgress] = useState(0);

  // Simulated Initial System Sync on Mount
  useEffect(() => {
    setIsInitialSync(true);
    setInitialSyncProgress(0);
    const interval = setInterval(() => {
      setInitialSyncProgress(prev => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsInitialSync(false), 500);
          return 100;
        }
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Extended Data with injected Safari risk components
  const extendedData = useMemo(() => {
    const safariRisks = [
      { ComponentCode: "SAF-901", ComponentName: "Panoramic Roof Frame", Module: "Body", Model: "Safari", Plant: "Pune", UoM: "EA", LeadTimeDays: 28, DailyUsageEst: 10, OnHandQty: 12, AllocatedQty: 8, SafetyStock: 60, QualityHoldQty: 0, StdUnitCostINR: 9200, InventoryValueINR: 110400, NextReplenishmentETA: "2026-03-12" },
      { ComponentCode: "SAF-902", ComponentName: "Harman Audio Processor", Module: "Electrical", Model: "Safari", Plant: "Pune", UoM: "EA", LeadTimeDays: 45, DailyUsageEst: 15, OnHandQty: 18, AllocatedQty: 12, SafetyStock: 100, QualityHoldQty: 2, StdUnitCostINR: 18500, InventoryValueINR: 333000, NextReplenishmentETA: "2026-03-25" },
      { ComponentCode: "SAF-903", ComponentName: "Oryx White Panel Set", Module: "Body", Model: "Safari", Plant: "Pune", UoM: "SET", LeadTimeDays: 14, DailyUsageEst: 20, OnHandQty: 35, AllocatedQty: 30, SafetyStock: 120, QualityHoldQty: 0, StdUnitCostINR: 24000, InventoryValueINR: 840000, NextReplenishmentETA: "2026-03-05" },
    ];
    // Filter out duplicates if any, and combine
    const originalFiltered = CSV_DATA.filter(d => !safariRisks.some(sr => sr.ComponentCode === d.ComponentCode));
    return [...safariRisks, ...originalFiltered];
  }, []);

  const stats = useMemo(() => {
    const lines = ['Curvv', 'Nexon', 'Altroz', 'Safari'];
    const lStats = lines.map(line => {
      const parts = extendedData.filter(p => p.Model.includes(line));
      const criticalParts = parts.filter(p => p.OnHandQty < p.SafetyStock);
      return { 
        name: line, 
        totalParts: parts.length, 
        criticalCount: criticalParts.length, 
        status: criticalParts.length > 0 ? 'Risk' : 'Stable' 
      };
    });
    return { lStats, isAnyLineCritical: lStats.some(l => l.status === 'Risk') };
  }, [extendedData]);

  const atRiskSKUs = useMemo(() => {
    return extendedData.filter(p => p.OnHandQty < p.SafetyStock);
  }, [extendedData]);

  const filteredParts = useMemo(() => {
    return extendedData.filter(p => 
      p.ComponentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ComponentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, extendedData]);

  // Pagination Logic
  const paginatedParts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredParts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredParts, currentPage]);

  const totalPages = Math.ceil(filteredParts.length / ITEMS_PER_PAGE);

  const runAiAudit = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowAuditModal(true);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const runSurgeSimulation = async () => {
    setSurgeLoading(true);
    setSurgeSyncing(true);
    setSurgeSyncProgress(0);
    setExecutedPOs(new Set());
    setShowSurgeModal(true);

    const syncInterval = setInterval(() => {
      setSurgeSyncProgress(prev => {
        const next = prev + Math.random() * 25;
        if (next >= 100) {
          clearInterval(syncInterval);
          return 100;
        }
        return next;
      });
    }, 120);

    try {
      const result = await getDemandSurgeAnalysis(surgeModel, surgeMagnitude, extendedData);
      // Ensure bar is visible for a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSurgeResult(result);
    } finally {
      setSurgeLoading(false);
      setSurgeSyncing(false);
    }
  };

  const handleExecutePO = (componentCode: string) => {
    setExecutedPOs(prev => {
      const next = new Set(prev);
      next.add(componentCode);
      return next;
    });
  };

  const handleReplenish = (componentCode: string) => {
    setReplenishedSKUs(prev => {
      const next = new Set(prev);
      next.add(componentCode);
      return next;
    });
  };

  // Initial Sync Window
  if (isInitialSync) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8 h-[70vh] bg-slate-50">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          <Warehouse className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={40} />
        </div>
        <div className="space-y-4 max-w-md">
          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Connecting to Inventory management, orders data, CRM and logistics system
          </h4>
          <p className="text-slate-500 text-sm font-medium italic">Synchronizing edge material nodes...</p>
        </div>
        <div className="w-72 h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-100 shadow-inner">
          <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${initialSyncProgress}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Materials Control Tower</h2>
          <div className={`mt-1 flex items-center space-x-2 text-[10px] font-black uppercase ${stats.isAnyLineCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
            <ShieldCheck size={14} />
            <span className="tracking-widest">{stats.isAnyLineCritical ? 'Supply Breach Detected' : 'Supply Health Normal'}</span>
          </div>
        </div>
        <button onClick={runAiAudit} disabled={loading} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20">
          {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>GLOBAL AI AUDIT</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between gap-4 group hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20"><TrendingUp size={24} /></div>
            <div>
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Nexon Demand Surge</h4>
              <p className="text-xs text-amber-700 font-medium">Business Case: Heavy discounts expected next 3-4 months.</p>
            </div>
          </div>
          <button onClick={runSurgeSimulation} disabled={surgeLoading} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            {surgeLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} ANALYZE SURGE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.lStats.map(line => (
          <div key={line.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all group">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Factory size={20} /></div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">{line.name} Line</h3>
            </div>
            <div className="flex justify-between items-end">
              <div><p className={`text-3xl font-black ${line.criticalCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{line.criticalCount}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Critical SKUs</p></div>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${line.status === 'Risk' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>{line.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 text-white rounded-lg"><ClipboardList size={18} /></div>
             <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Inventory Diagnostic Ledger</h3>
          </div>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Filter SKU or Model..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full md:w-64 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Component</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Model</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">On Hand</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Health</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedParts.map((p) => {
                const isReplenished = replenishedSKUs.has(p.ComponentCode);
                const isCritical = p.OnHandQty < p.SafetyStock && !isReplenished;
                const effectiveQty = isReplenished ? Math.round(p.SafetyStock * 1.3) : p.OnHandQty;
                const healthPercent = Math.min(100, Math.round((effectiveQty / (p.SafetyStock * 1.5)) * 100));
                
                return (
                  <tr key={p.ComponentCode} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 text-xs">{p.ComponentCode}</td>
                    <td className="px-6 py-4"><p className="text-xs font-black text-slate-900">{p.ComponentName}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{p.Module}</p></td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-wider">{p.Model}</span></td>
                    <td className="px-6 py-4 font-black text-slate-900 text-xs">{effectiveQty} {p.UoM}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                          <div className={`h-full ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${healthPercent}%` }} />
                        </div>
                        <span className={`text-[10px] font-black ${isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>{healthPercent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ChevronRight size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {paginatedParts.length} of {filteredParts.length} SKUs
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black px-4">{currentPage} / {totalPages || 1}</span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Global AI Audit Replenishment Window */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
             <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-600 rounded-2xl shadow-inner"><ShieldCheck size={28} /></div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Global AI Audit: Stock Replenishment</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Automatic detection of SKUs below safety thresholds</p>
                   </div>
                </div>
                <button onClick={() => setShowAuditModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                <div className="grid grid-cols-1 gap-4">
                  {atRiskSKUs.map(sku => {
                    const isDone = replenishedSKUs.has(sku.ComponentCode);
                    return (
                      <div key={sku.ComponentCode} className={`p-6 bg-white border rounded-2xl flex items-center justify-between shadow-sm transition-all ${isDone ? 'border-emerald-200 bg-emerald-50/30 shadow-none' : 'border-slate-200 hover:border-blue-300'}`}>
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                               <Package size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-900">{sku.ComponentName}</p>
                               <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">{sku.ComponentCode}</span>
                                 <span className="text-[10px] font-black text-slate-600">•</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">{sku.Model}</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-400 uppercase">Deficit</p>
                               <p className="text-lg font-black text-rose-600">-{sku.SafetyStock - sku.OnHandQty} {sku.UoM}</p>
                            </div>
                            
                            <button 
                              disabled={isDone}
                              onClick={() => handleReplenish(sku.ComponentCode)}
                              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                                isDone 
                                  ? 'bg-emerald-100 text-emerald-600 cursor-default shadow-none' 
                                  : 'bg-blue-600 text-white shadow-lg shadow-blue-900/10 hover:bg-blue-700'
                              }`}
                            >
                               {isDone ? <CheckCircle2 size={16} /> : <ArrowUpCircle size={16} />}
                               {isDone ? 'REPLENISHED' : 'AUTO-REPLENISH'}
                            </button>
                         </div>
                      </div>
                    );
                  })}
                </div>
             </div>

             <div className="p-8 bg-white border-t border-slate-100 flex gap-4 shrink-0">
                <button onClick={() => setShowAuditModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Close Audit Hub
                </button>
                <button 
                  onClick={() => atRiskSKUs.forEach(sku => handleReplenish(sku.ComponentCode))}
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={16} /> REPLENISH ALL AT-RISK SKUS
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Demand Surge Analysis Modal */}
      {showSurgeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-6xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
             <div className="bg-amber-600 p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/20 rounded-2xl shadow-inner"><TrendingUp size={28} /></div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Demand Surge: Nexon Discount Window</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-white text-amber-600 rounded text-[9px] font-black uppercase tracking-widest">Safety Stock Bump Active</span>
                        <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest">+45% Volume Forecast</p>
                      </div>
                   </div>
                </div>
                <button onClick={() => setShowSurgeModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={24} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto bg-slate-50/50">
               {surgeSyncing ? (
                 <div className="flex flex-col items-center justify-center p-20 text-center space-y-8 h-full">
                   <div className="relative">
                     <div className="w-24 h-24 rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin" />
                     <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" size={32} />
                   </div>
                   <div className="space-y-2">
                     <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Connecting to CRM, orders, Inventory and PO's</h4>
                     <p className="text-slate-500 text-sm font-medium italic">Establishing secure ERP handshake protocols...</p>
                   </div>
                   <div className="w-64 h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                     <div className="h-full bg-amber-500 transition-all duration-300 ease-out" style={{ width: `${surgeSyncProgress}%` }} />
                   </div>
                 </div>
               ) : surgeResult ? (
                 <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                    
                    {/* Left: Component Risks */}
                    <div className="lg:col-span-4 space-y-6">
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-slate-200">
                          <Shield size={14} className="text-rose-600" /> ERP At-Risk Components
                       </h4>
                       <div className="space-y-2">
                          {surgeResult.riskComponents?.map((comp: any) => {
                            const isExecuted = executedPOs.has(comp.code);
                            return (
                              <div key={comp.code} className={`p-4 border rounded-2xl flex items-center justify-between shadow-sm transition-all ${
                                isExecuted ? 'bg-emerald-50 border-emerald-200 shadow-emerald-900/5' : 'bg-white border-slate-200 hover:border-rose-200'
                              }`}>
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isExecuted ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                      {isExecuted ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-900 leading-tight">{comp.name}</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{comp.code}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className={`text-[10px] font-black ${isExecuted ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {isExecuted ? 'PO EXECUTED' : `-${comp.deficit} Units`}
                                    </p>
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                    </div>

                    {/* Right: Procurement System */}
                    <div className="lg:col-span-8 space-y-6">
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-slate-200">
                          <ShoppingCart size={14} className="text-blue-600" /> ERP Automated Procurement Options
                       </h4>
                       <div className="space-y-8">
                          {surgeResult.riskComponents?.filter((c: any) => !executedPOs.has(c.code)).map((comp: any) => (
                            <div key={comp.code} className="space-y-4">
                               <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                     <Package size={12} /> Sourcing for: <span className="text-slate-900">{comp.name}</span>
                                  </h5>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {comp.vendors?.map((opt: any, idx: number) => {
                                    const isBest = opt.isBestOption;
                                    return (
                                      <div key={idx} className={`p-4 rounded-2xl border transition-all flex flex-col relative overflow-hidden ${
                                        isBest 
                                          ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-900/5' 
                                          : 'bg-white border-slate-200 shadow-sm'
                                      }`}>
                                         <p className="text-[10px] font-black uppercase text-slate-900 mb-2">{opt.vendorName}</p>
                                         <div className="space-y-1.5 flex-1 text-[9px] font-bold text-slate-500">
                                            <div className="flex justify-between"><span>Lead Time</span><span className="text-slate-900">{opt.leadTimeDays}d</span></div>
                                            <div className="flex justify-between"><span>Plant</span><span className="text-slate-900">{opt.location}</span></div>
                                            <div className="flex justify-between"><span>Freight</span><span className="text-slate-900">₹{opt.freightCostINR.toLocaleString()}</span></div>
                                         </div>
                                         <button onClick={() => handleExecutePO(comp.code)} className={`mt-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isBest ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-black'}`}>Execute PO</button>
                                      </div>
                                    );
                                  })}
                               </div>
                            </div>
                          ))}
                          {surgeResult.riskComponents?.filter((c: any) => !executedPOs.has(c.code)).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-emerald-50 rounded-[2.5rem] border-2 border-dashed border-emerald-200 animate-in zoom-in-95">
                               <div className="p-4 bg-emerald-500 text-white rounded-full shadow-lg"><CheckCircle size={32} /></div>
                               <h5 className="text-lg font-black text-emerald-900 uppercase">Analysis Resolved</h5>
                               <p className="text-xs text-emerald-700 font-medium">All critical surge deficit POs have been successfully triggered.</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               ) : null}
             </div>

             <div className="p-8 bg-white border-t border-slate-100 flex gap-4 shrink-0">
                <button onClick={() => setShowSurgeModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Exit Analysis Hub
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(DashboardMaterials);
