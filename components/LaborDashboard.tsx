
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { getLaborRebalancingSuggestion } from '../services/laborService';
import { ProductionLine, Worker, PlantConfig } from '../types';
import { 
  RefreshCcw, Loader2, Sparkles, ShieldCheck, 
  Search, ClipboardList, ChevronDown, ChevronUp, Factory, Activity, 
  Target, Scan, UserCheck, 
  Briefcase, Zap, X, Clock,
  TrendingUp, ArrowRightLeft, Car, 
  Database, Wrench, Settings, GraduationCap,
  ClipboardCheck, Truck, CheckCircle2, UserMinus,
  AlertCircle, RotateCcw, Cpu
} from 'lucide-react';

const StatusBadge = memo(({ status }: { status: Worker['status'] }) => {
  const getColors = (s: Worker['status']) => {
    switch (s) {
      case 'Present': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Absent': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Maintenance': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'TPM': return 'text-purple-600 bg-purple-50 border-purple-100';
      case '5S': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'Training': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Audit Prep': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Support': return 'text-slate-600 bg-slate-100 border-slate-200';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shadow-sm ${getColors(status)}`}>
      {status}
    </span>
  );
});

interface LaborDashboardProps {
  initialLines: ProductionLine[];
  currentShift: 'A' | 'B' | 'C';
  config: PlantConfig;
  productionStats: { planned: number; actual: number; percent: number };
}

const LaborDashboard: React.FC<LaborDashboardProps> = ({ initialLines, currentShift, config, productionStats }) => {
  const [lines, setLines] = useState<ProductionLine[]>(initialLines);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [syncProgress, setSyncProgress] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [lastEvent, setLastEvent] = useState<string>(`Shift ${currentShift} Initialized.`);
  const [viewMode, setViewMode] = useState<'lines' | 'roster' | 'summary'>('lines');
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  useEffect(() => {
    setIsInitialSync(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setIsInitialSync(false), 500);
      }
      setSyncProgress(progress);
    }, 300);
    return () => clearInterval(interval);
  }, [currentShift]);

  useEffect(() => {
    if (!activeScenario && !isInitialSync) {
      setLines(initialLines);
      setAiSuggestions(null);
    }
  }, [initialLines, currentShift, activeScenario, isInitialSync]);

  const refreshAi = useCallback(async (currentLines: ProductionLine[] = lines, eventText: string = lastEvent) => {
    setLoading(true);
    setError(false);
    setAiSuggestions(null);
    
    // Safety UI timeout
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(true);
      }
    }, 65000);

    try {
      const result = await getLaborRebalancingSuggestion(currentLines, eventText);
      if (result && !result.error) {
        setAiSuggestions(result);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error("Labor AI Exception:", e);
      setError(true);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [lines, lastEvent, loading]);

  const runSurplusScenario = useCallback(() => {
    setActiveScenario("SURPLUS_OPTIMIZATION");
    const newLines = initialLines.map(l => ({
      ...l,
      currentWorkers: l.currentWorkers.map(w => ({ ...w, status: 'Present' as const })),
      buffers: l.buffers.map(w => ({ ...w, status: 'Present' as const }))
    }));
    setLines(newLines);
    const event = "SITUATION: 100% Attendance. Identify and reallocate surplus workers to TPM, 5S, or training.";
    setLastEvent(event);
    refreshAi(newLines, event);
  }, [initialLines, refreshAi]);

  const runAbsenteeismScenario = useCallback(() => {
    setActiveScenario("ABSENTEEISM_REBALANCE");
    const newLines = initialLines.map(l => {
      if (l.id === 'L2') return { ...l, currentWorkers: l.currentWorkers.map((w, idx) => idx < 3 ? { ...w, status: 'Absent' as const } : w), buffers: l.buffers.map(w => ({ ...w, status: 'Absent' as const })) };
      return l;
    });
    setLines(newLines);
    const event = "Line 2 Crisis: 50% Absenteeism. Prioritize P1 continuity by moving surplus workers from other lines.";
    setLastEvent(event);
    refreshAi(newLines, event);
  }, [initialLines, refreshAi]);

  const resetAll = useCallback(() => {
    setActiveScenario(null);
    setLines(initialLines);
    setAiSuggestions(null);
    setError(false);
    setLoading(false);
  }, [initialLines]);

  const stats = useMemo(() => {
    const allWorkers = lines.flatMap(l => [...l.currentWorkers, ...l.buffers]);
    const allocation = { 
      maintenance: 0, 
      tpm: 0, 
      training: 0, 
      fives: 0, 
      auditprep: 0, 
      support: 0, 
      present: 0, 
      absent: 0 
    };

    allWorkers.forEach(w => {
      if (w.status === 'Present') allocation.present++;
      else if (w.status === 'Absent' || w.status === 'On Leave' || w.status === 'Emergency') allocation.absent++;
      else {
        let key: keyof typeof allocation;
        switch(w.status) {
          case 'Maintenance': key = 'maintenance'; break;
          case 'TPM': key = 'tpm'; break;
          case '5S': key = 'fives'; break;
          case 'Training': key = 'training'; break;
          case 'Audit Prep': key = 'auditprep'; break;
          case 'Support': key = 'support'; break;
          default: return;
        }
        allocation[key]++;
      }
    });

    const lStats = lines.map(l => {
      const presentOnLine = [...l.currentWorkers, ...l.buffers].filter(w => w.status === 'Present').length;
      return { 
        ...l, 
        actualPresent: presentOnLine, 
        isActuallyShort: presentOnLine < l.requiredManpower,
        surplus: Math.max(0, presentOnLine - l.requiredManpower)
      };
    });

    return { 
      allWorkers, 
      lStats, 
      allocation, 
      isAnyLineShort: lStats.some(l => l.isActuallyShort),
      totalSurplus: lStats.reduce((acc, l) => acc + l.surplus, 0)
    };
  }, [lines]);

  const handleExecute = useCallback((suggestion: any, idx: number) => {
    const meta = suggestion?.executionMetadata;
    if (!meta || !meta.workerNames) return;
    
    // Hardened name cleaning
    const targetNames = meta.workerNames.map((n: string) => n.trim().toLowerCase().replace(/\s+/g, ' '));
    
    setExecutingId(idx);
    
    setTimeout(() => {
      try {
        setLines(prev => {
          const cloned: ProductionLine[] = JSON.parse(JSON.stringify(prev));
          let matchedAny = false;

          if (meta.action === 'MOVE') {
            const movedWorkers: Worker[] = [];
            
            // 1. Extract from source lines
            cloned.forEach(l => {
              const filterOut = (w: Worker) => {
                const cleanedWName = w.name.toLowerCase().trim().replace(/\s+/g, ' ');
                if (targetNames.includes(cleanedWName) && w.status === 'Present') {
                  movedWorkers.push({ ...w, assignedLine: meta.toLine!, status: 'Present' });
                  matchedAny = true;
                  return false;
                }
                return true;
              };
              l.currentWorkers = l.currentWorkers.filter(filterOut);
              l.buffers = l.buffers.filter(filterOut);
            });
            
            // 2. Insert into destination line
            if (movedWorkers.length > 0) {
              const targetLine = cloned.find(l => l.id === meta.toLine);
              if (targetLine) {
                targetLine.currentWorkers.push(...movedWorkers);
              }
            }
          } else {
            // Task Assignment
            cloned.forEach(l => {
              const updateFn = (w: Worker) => {
                const cleanedWName = w.name.toLowerCase().trim().replace(/\s+/g, ' ');
                if (targetNames.includes(cleanedWName) && w.status === 'Present') {
                  matchedAny = true;
                  const statusMap: Record<string, Worker['status']> = { 
                    tpm: 'TPM', 
                    '5s': '5S', 
                    maintenance: 'Maintenance', 
                    training: 'Training'
                  };
                  return { ...w, status: statusMap[(meta.taskCategory || '').toLowerCase()] || 'Support' };
                }
                return w;
              };
              l.currentWorkers = l.currentWorkers.map(updateFn);
              l.buffers = l.buffers.map(updateFn);
            });
          }

          if (!matchedAny) {
            console.warn("Execute Action: No workers matched current floor state.", targetNames);
          }

          return cloned;
        });
      } finally {
        setExecutingId(null);
        setAiSuggestions((p: any) => p ? { ...p, suggestions: p.suggestions.filter((_: any, i: number) => i !== idx) } : null);
      }
    }, 800);
  }, [lines]);

  const summaryConfigs = [
    { key: 'present', label: 'Direct Operations', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { key: 'absent', label: 'Total Absenteeism', icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { key: 'tpm', label: 'TPM Activities', icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { key: 'fives', label: '5S Organization', icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { key: 'maintenance', label: 'Line Maintenance', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { key: 'training', label: 'Skills Training', icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { key: 'auditprep', label: 'Audit / QC Prep', icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { key: 'support', label: 'Auxiliary Support', icon: Truck, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Car size={24} /></div>
          <div><h3 className="text-sm font-black text-slate-900 uppercase">Shift Throughput</h3></div>
        </div>
        <div className="flex-1 max-w-lg w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${productionStats.percent}%` }} /></div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Labor Control Center</h2>
          <div className="flex gap-4 mt-1">
             <div className={`flex items-center space-x-2 text-[10px] font-black uppercase ${stats.isAnyLineShort ? 'text-rose-600' : 'text-emerald-600'}`}>
               <ShieldCheck size={14} /> <span>P1: Continuity {stats.isAnyLineShort ? '(Action Req)' : '(Verified)'}</span>
             </div>
             <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-amber-600">
               <Target size={14} /> <span>Unassigned Surplus: {stats.totalSurplus}</span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
              <button onClick={runSurplusScenario} disabled={loading} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeScenario === 'SURPLUS_OPTIMIZATION' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200 disabled:opacity-50'}`}><TrendingUp size={14} className="inline mr-1" /> CASE 1: SURPLUS</button>
              <button onClick={runAbsenteeismScenario} disabled={loading} className={`ml-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeScenario === 'ABSENTEEISM_REBALANCE' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200 disabled:opacity-50'}`}><ArrowRightLeft size={14} className="inline mr-1" /> CASE 2: ABSENTEEISM</button>
           </div>
           <button onClick={resetAll} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><RefreshCcw size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex bg-slate-200/50 p-1 rounded-lg w-fit border border-slate-200">
            <button onClick={() => setViewMode('lines')} className={`px-6 py-2 text-[10px] font-black rounded transition-all uppercase tracking-widest ${viewMode === 'lines' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Visual Lines</button>
            <button onClick={() => setViewMode('roster')} className={`px-6 py-2 text-[10px] font-black rounded transition-all uppercase tracking-widest ${viewMode === 'roster' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Master Roster</button>
            <button onClick={() => setViewMode('summary')} className={`px-6 py-2 text-[10px] font-black rounded transition-all uppercase tracking-widest ${viewMode === 'summary' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Summary</button>
          </div>

          {viewMode === 'lines' && stats.lStats.map(line => (
            <div key={line.id} className={`bg-white rounded-xl border shadow-sm group transition-all ${line.isActuallyShort ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-slate-200'}`}>
              <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50" onClick={() => setExpandedLine(expandedLine === line.id ? null : line.id)}>
                 <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${line.isActuallyShort ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Factory size={18} /></div>
                    <div><h4 className="font-bold text-slate-900">{line.name}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Target: {line.requiredManpower} • Present: {line.actualPresent}</p></div>
                 </div>
                 <div className="flex items-center space-x-6">
                    <div className="text-right"><p className={`text-sm font-black ${line.isActuallyShort ? 'text-rose-600' : 'text-slate-900'}`}>{line.actualPresent}/{line.requiredManpower}</p></div>
                    {expandedLine === line.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                 </div>
              </div>
              {expandedLine === line.id && (
                 <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="flex flex-wrap gap-2">
                      {[...line.currentWorkers, ...line.buffers].map(w => (
                         <div key={w.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between w-full md:w-[48%]">
                            <div><p className="text-xs font-bold text-slate-900">{w.name}</p><p className="text-[10px] text-slate-400 font-medium">{w.id}</p></div>
                            <StatusBadge status={w.status} />
                         </div>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          ))}

          {viewMode === 'summary' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {summaryConfigs.map(cfg => {
                   const count = (stats.allocation as any)[cfg.key];
                   const Icon = cfg.icon;
                   return (
                    <div key={cfg.key} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${cfg.bg} ${cfg.color} group-hover:scale-110 transition-transform`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{cfg.label}</h4>
                          <p className="text-2xl font-black text-slate-900 mt-1">{count}</p>
                        </div>
                      </div>
                      <div className="h-8 w-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${cfg.color.replace('text', 'bg')} opacity-40`} style={{ height: `${Math.min(100, (count / stats.allWorkers.length) * 500)}%` }} />
                      </div>
                    </div>
                   );
                 })}
               </div>
             </div>
          )}
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-xl flex flex-col min-h-[500px] border border-slate-800 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5"><RefreshCcw size={120} className="animate-spin-slow" /></div>
           <div className="flex items-center gap-2 mb-8 relative z-10"><div className="p-2 bg-blue-500/20 rounded-lg"><Sparkles className="text-blue-400" size={20} /></div><h3 className="font-black text-lg tracking-tight">AI Deployment Advisor</h3></div>
           
           {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-in fade-in">
                 <div className="relative mb-6">
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                    <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-300" size={16} />
                 </div>
                 <h4 className="text-xs font-black text-white uppercase tracking-widest">Solving Manpower Matrix</h4>
                 <p className="text-[10px] text-slate-500 mt-2 max-w-[200px]">Balancing P1 floor constraints...</p>
              </div>
           ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                 <AlertCircle size={40} className="text-rose-500 mb-4" />
                 <h4 className="text-xs font-black text-white uppercase">Advisor Timeout</h4>
                 <p className="text-[10px] text-slate-400 mt-2 px-6">The AI engine is under heavy load or could not reach the server.</p>
                 <button onClick={() => refreshAi()} className="mt-8 px-8 py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all">
                   RE-INITIATE SOLVER
                 </button>
              </div>
           ) : aiSuggestions && aiSuggestions.suggestions?.length > 0 ? (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar relative z-10">
                 {aiSuggestions.suggestions.map((s: any, idx: number) => (
                    <div key={idx} className={`p-4 bg-white/5 border border-white/10 rounded-xl border-l-4 hover:bg-white/10 transition-all ${s.executionMetadata?.action === 'MOVE' ? 'border-l-rose-500 shadow-lg shadow-rose-900/10' : 'border-l-blue-500'}`}>
                       <h4 className="text-xs font-bold mb-1 flex items-center justify-between">
                         {s.title}
                         {s.executionMetadata?.action === 'MOVE' ? <ArrowRightLeft size={12} className="text-rose-400" /> : <Zap size={12} className="text-blue-400" />}
                       </h4>
                       <p className="text-[10px] text-slate-400 leading-relaxed mb-3">{s.description}</p>
                       <div className="flex flex-wrap gap-1 mb-4">
                         {s.executionMetadata?.workerNames?.map((n: string) => (
                           <span key={n} className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold text-white uppercase">{n}</span>
                         ))}
                       </div>
                       <button 
                        onClick={() => handleExecute(s, idx)} 
                        disabled={executingId !== null} 
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                       >
                          {executingId === idx ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={14} />} EXECUTE ACTION
                       </button>
                    </div>
                 ))}
              </div>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 py-12">
                <Scan size={48} className="text-slate-500 mb-4" />
                <h4 className="font-bold text-white uppercase text-xs tracking-[0.2em]">Balanced</h4>
                <p className="text-[10px] text-slate-500 mt-2">Current deployment is optimal.</p>
              </div>
           )}
           <div className="mt-6 pt-6 border-t border-white/10 relative z-10"><button onClick={resetAll} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase transition-colors border border-white/5">Reset Deployment</button></div>
        </div>
      </div>
    </div>
  );
};

export default memo(LaborDashboard);
