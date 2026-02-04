
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { getLaborRebalancingSuggestion } from '../services/laborService';
import { ProductionLine, Worker, PlantConfig, Language } from '../types';
import { useI18n } from '../services/i18nService';
import { 
  RefreshCcw, Loader2, Sparkles, ShieldCheck, 
  Search, ClipboardList, ChevronDown, ChevronUp, Factory, Activity, 
  Target, Scan, UserCheck, 
  Briefcase, Zap, X, Clock,
  TrendingUp, ArrowRightLeft, Car, 
  Database, Wrench, Settings, GraduationCap,
  ClipboardCheck, Truck, CheckCircle2, UserMinus,
  AlertCircle, RotateCcw, Cpu, Users, Layers,
  BarChart3, PieChart as PieIcon, Info, Mail, Pulse
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
  lang: Language;
}

const LaborDashboard: React.FC<LaborDashboardProps> = ({ initialLines, currentShift, config, productionStats, lang }) => {
  const t = useI18n(lang);
  const [lines, setLines] = useState<ProductionLine[]>(initialLines);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Initializing HR Hub Connection...');
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [lastEvent, setLastEvent] = useState<string>(`Shift ${currentShift} Initialized.`);
  const [viewMode, setViewMode] = useState<'lines' | 'roster' | 'summary'>('lines');
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [showSmsToast, setShowSmsToast] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Initial Immersive ERP Handshake
  useEffect(() => {
    setIsInitialSync(true);
    setSyncProgress(0);
    const messages = [
      'Establishing Secure Handshake with TATA HR Hub...',
      'Accessing SAP SuccessFactors Punch-In Ledger...',
      'Authenticating Biometric Attendance Data...',
      'Cross-referencing Roster Skill Matrix...',
      `Mapping 36 Active Operators to Shift ${currentShift} Node...`,
      'Sync Complete. Ready for Deployment.'
    ];
    
    let msgIdx = 0;
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        const next = prev + Math.random() * 12;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsInitialSync(false), 800);
          return 100;
        }
        const calculatedMsgIdx = Math.min(messages.length - 1, Math.floor((next / 100) * messages.length));
        if (calculatedMsgIdx !== msgIdx) {
          msgIdx = calculatedMsgIdx;
          setSyncMessage(messages[calculatedMsgIdx]);
        }
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [currentShift]);

  // Sync Timestamp Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // When shift or initialLines changes, reset state unless in a scenario
  useEffect(() => {
    if (!activeScenario && !isInitialSync) {
      setLines(initialLines);
      setAiSuggestions(null);
    }
  }, [initialLines, currentShift, activeScenario, isInitialSync]);

  // Handle SMS Toast auto-hide
  useEffect(() => {
    if (showSmsToast) {
      const timer = setTimeout(() => setShowSmsToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSmsToast]);

  const refreshAi = useCallback(async (currentLines: ProductionLine[] = lines, eventText: string = lastEvent) => {
    setLoading(true);
    setError(false);
    setAiSuggestions(null);
    
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(true);
      }
    }, 15000);

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
    const event = `Case 1: Surplus manpower identified in Shift ${currentShift}. AI requested for activity reallocation.`;
    setLastEvent(event);
    refreshAi(newLines, event);
  }, [initialLines, refreshAi, currentShift]);

  const runAbsenteeismScenario = useCallback(() => {
    setActiveScenario("ABSENTEEISM_CRISIS");
    
    // Dynamic mapping of IDs to match current shift prefix (e.g., TM-A-L2-MN-1)
    const baseAbsentCodes = [
      'L2-MN-1', 'L2-MN-2', 'L2-BUF-5', 
      'L4-MN-3', 'L4-MN-4', 'L4-BUF-5', 
      'L6-MN-4', 'L6-BUF-6', 'L1-MN-1'
    ];
    const absentIds = baseAbsentCodes.map(code => `TM-${currentShift}-${code}`);
    
    const newLines = initialLines.map(l => ({
      ...l,
      currentWorkers: l.currentWorkers.map(w => ({ 
        ...w, 
        status: absentIds.includes(w.id) ? 'Absent' : 'Present' as const 
      })),
      buffers: l.buffers.map(w => ({ 
        ...w, 
        status: absentIds.includes(w.id) ? 'Absent' : 'Present' as const 
      }))
    }));
    
    setLines(newLines);
    const event = `Case 2: High Absenteeism Detected in Shift ${currentShift}. AI required for line balancing.`;
    setLastEvent(event);
    refreshAi(newLines, event);
  }, [initialLines, refreshAi, currentShift]);

  const resetAll = useCallback(() => {
    setActiveScenario(null);
    setLines(initialLines);
    setAiSuggestions(null);
    setError(false);
    setLoading(false);
  }, [initialLines]);

  const stats = useMemo(() => {
    const allWorkers = lines.flatMap(l => [...l.currentWorkers, ...l.buffers]);
    const allocation = { maintenance: 0, tpm: 0, training: 0, fives: 0, auditprep: 0, support: 0, present: 0, absent: 0 };
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
      return { ...l, actualPresent: presentOnLine, isActuallyShort: presentOnLine < l.requiredManpower, surplus: Math.max(0, presentOnLine - l.requiredManpower) };
    });
    
    // REAL-TIME ATTENDANCE METRIC
    const totalHeadcount = allWorkers.length;
    const attendanceRatio = totalHeadcount > 0 ? (allocation.present / totalHeadcount) * 100 : 0;

    return { 
      allWorkers, 
      lStats, 
      allocation, 
      isAnyLineShort: lStats.some(l => l.isActuallyShort), 
      totalSurplus: lStats.reduce((acc, l) => acc + l.surplus, 0),
      totalHeadcount,
      attendanceRatio
    };
  }, [lines]);

  const handleExecute = useCallback((suggestion: any, idx: number) => {
    const meta = suggestion?.executionMetadata;
    if (!meta || !meta.workerNames) return;

    const cleanName = (name: string) => name.replace(/\s*\([ABC]\)\s*$/, '').trim().toLowerCase();
    const targetNamesClean = meta.workerNames.map((n: string) => cleanName(n));

    setExecutingId(idx);
    setTimeout(() => {
      try {
        setLines(prev => {
          const cloned: ProductionLine[] = JSON.parse(JSON.stringify(prev));
          let matchedWorkers: Worker[] = [];
          
          if (meta.action === 'MOVE') {
            const targetLine = cloned.find(l => 
              l.id.toLowerCase() === meta.toLine?.toLowerCase() || 
              l.name.toLowerCase() === meta.toLine?.toLowerCase()
            );

            if (targetLine) {
              cloned.forEach(l => {
                l.currentWorkers = l.currentWorkers.filter(w => {
                  const wNameClean = cleanName(w.name);
                  if (targetNamesClean.includes(wNameClean)) { 
                    matchedWorkers.push({ ...w, assignedLine: targetLine.id, status: 'Present' }); 
                    return false; 
                  }
                  return true;
                });
                l.buffers = l.buffers.filter(w => {
                  const wNameClean = cleanName(w.name);
                  if (targetNamesClean.includes(wNameClean)) { 
                    matchedWorkers.push({ ...w, assignedLine: targetLine.id, status: 'Present' }); 
                    return false; 
                  }
                  return true;
                });
              });
              targetLine.currentWorkers.push(...matchedWorkers);
            }
          } else {
            cloned.forEach(l => {
              const updateFn = (w: Worker) => {
                const wNameClean = cleanName(w.name);
                if (targetNamesClean.includes(wNameClean)) {
                  const statusMap: Record<string, Worker['status']> = { 
                    tpm: 'TPM', '5s': '5S', maintenance: 'Maintenance', 
                    training: 'Training', audit: 'Audit Prep', logistic: 'Support' 
                  };
                  return { ...w, status: statusMap[(meta.taskCategory || '').toLowerCase()] || 'Support' };
                }
                return w;
              };
              l.currentWorkers = l.currentWorkers.map(updateFn);
              l.buffers = l.buffers.map(updateFn);
            });
          }
          return cloned;
        });
        
        if (aiSuggestions?.suggestions?.length === 1) {
          setShowSmsToast(true);
        }
        
      } finally {
        setExecutingId(null);
        setAiSuggestions((p: any) => p ? { ...p, suggestions: p.suggestions.filter((_: any, i: number) => i !== idx) } : null);
      }
    }, 1000);
  }, [aiSuggestions]);

  const coreOpsConfigs = [
    { key: 'present', label: t('direct_ops'), desc: 'Main line assembly', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
    { key: 'absent', label: t('absent'), desc: 'Leave or unauthorized', icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' },
  ];

  const valueAddConfigs = [
    { key: 'tpm', label: 'TPM', desc: 'Total Productive Maintenance', icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50', bar: 'bg-purple-500' },
    { key: 'fives', label: '5S', desc: 'Efficiency standards', icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-500' },
    { key: 'maintenance', label: 'Maintenance', desc: 'Asset support', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
    { key: 'training', label: t('on_job_training'), desc: 'On-job skills', icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' },
    { key: 'support', label: t('logistic_support'), desc: 'Material flow support', icon: Truck, color: 'text-slate-600', bg: 'bg-slate-50', bar: 'bg-slate-500' },
    { key: 'auditprep', label: t('audit_support'), desc: 'Quality compliance', icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' },
  ];

  // Dynamic progress bar color based on attendance
  const progressBarColor = stats.attendanceRatio > 90 ? 'bg-emerald-500' : stats.attendanceRatio > 75 ? 'bg-amber-500' : 'bg-rose-500';

  if (isInitialSync) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8 h-[70vh] bg-slate-50 animate-in fade-in duration-500">
        <div className="relative"><div className="w-32 h-32 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" /><Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={40} /></div>
        <div className="space-y-4 max-w-md"><h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">ERP Connection</h4><p className="text-slate-500 text-sm font-medium italic">{syncMessage}</p></div>
        <div className="w-80 h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-100 shadow-inner"><div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${syncProgress}%` }} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* SMS Notification Toast */}
      {showSmsToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 border border-emerald-500/20">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Mail size={20} className="animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Notification Alert</p>
              <p className="text-sm font-bold">{t('sms_sent_msg')}</p>
            </div>
            <button onClick={() => setShowSmsToast(false)} className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* REAL-TIME MANPOWER MONITOR WINDOW */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group">
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl transition-all duration-500 ${stats.attendanceRatio > 80 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
            <Car size={32} className={stats.attendanceRatio < 80 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {stats.totalHeadcount} Manpower Roster
              </h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live Sync: {lastSyncTime}</span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Deployment Efficiency: <span className={stats.attendanceRatio < 80 ? 'text-rose-600' : 'text-emerald-600'}>{stats.attendanceRatio.toFixed(1)}%</span> • {stats.allocation.present} / {stats.totalHeadcount} Operators
            </p>
          </div>
        </div>
        <div className="flex-1 max-w-xl w-full">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Attendance Pulse</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${stats.attendanceRatio < 80 ? 'text-rose-600' : 'text-slate-500'}`}>
                {stats.attendanceRatio < 80 ? 'CRITICAL DEFICIT' : 'OPTIMAL'}
              </span>
           </div>
           <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200 shadow-inner p-1">
             <div 
               className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${progressBarColor}`} 
               style={{ width: `${stats.attendanceRatio}%` }} 
             />
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('labor_control_center')}</h2>
          <div className="flex gap-4 mt-1">
             <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-emerald-600"><ShieldCheck size={14} /> <span>{t('erp_synced')}</span></div>
             <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-amber-600"><Target size={14} /> <span>{t('surplus_buffer')}: {stats.totalSurplus}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
              <button onClick={runSurplusScenario} disabled={loading} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeScenario === 'SURPLUS_OPTIMIZATION' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200 disabled:opacity-50'}`}><TrendingUp size={14} className="inline mr-1" /> {t('case_surplus')}</button>
              <button onClick={runAbsenteeismScenario} disabled={loading} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeScenario === 'ABSENTEEISM_CRISIS' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200 disabled:opacity-50'}`}><UserMinus size={14} className="inline mr-1" /> {t('case_absenteeism')}</button>
           </div>
           <button onClick={resetAll} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><RefreshCcw size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex bg-slate-200/50 p-1 rounded-lg w-fit border border-slate-200">
            <button onClick={() => setViewMode('lines')} className={`px-6 py-2 text-[10px] font-black rounded transition-all uppercase tracking-widest ${viewMode === 'lines' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t('visual_lines')}</button>
            <button onClick={() => setViewMode('roster')} className={`px-6 py-2 text-[10px] font-black rounded transition-all uppercase tracking-widest ${viewMode === 'roster' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t('master_roster')}</button>
            <button onClick={() => setViewMode('summary')} className={`px-6 py-2 text-[10px] font-black rounded transition-all uppercase tracking-widest ${viewMode === 'summary' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t('summary')}</button>
          </div>

          {viewMode === 'lines' && stats.lStats.map(line => (
            <div key={line.id} className={`bg-white rounded-xl border shadow-sm group transition-all ${line.isActuallyShort ? 'border-rose-300 ring-4 ring-rose-500/10' : 'border-slate-200'}`}>
              <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50" onClick={() => setExpandedLine(expandedLine === line.id ? null : line.id)}>
                 <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${line.isActuallyShort ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}><Factory size={18} /></div>
                    <div>
                      <h4 className="font-bold text-slate-900">{line.name}</h4>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${line.isActuallyShort ? 'text-rose-600' : 'text-slate-400'}`}>{t('required')}: {line.requiredManpower} • {t('present')}: {line.actualPresent}</p>
                    </div>
                 </div>
                 <div className="flex items-center space-x-6">
                    <div className="text-right font-black">{line.actualPresent}/{line.requiredManpower}</div>
                    {expandedLine === line.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                 </div>
              </div>
              {expandedLine === line.id && (
                 <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="flex flex-wrap gap-2">
                      {[...line.currentWorkers, ...line.buffers].map(w => (
                         <div key={w.id} className="p-3 bg-white border rounded-xl flex items-center justify-between w-full md:w-[48%]"><p className="text-xs font-bold text-slate-900">{w.name}</p><StatusBadge status={w.status} /></div>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          ))}

          {viewMode === 'roster' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">ERP Roster</h3>
                <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" placeholder={t('search_roster')} className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none" value={rosterSearch} onChange={(e) => setRosterSearch(e.target.value)} /></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white border-b text-slate-400 font-bold uppercase tracking-tighter">
                    <tr><th className="px-4 py-3">{t('employee_id')}</th><th className="px-4 py-3">{t('operator_name')}</th><th className="px-4 py-3">{t('assigned_line')}</th><th className="px-4 py-3">{t('status')}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.allWorkers.filter(w => w.name.toLowerCase().includes(rosterSearch.toLowerCase())).map(w => (
                      <tr key={w.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-mono font-bold text-indigo-600">{w.id}</td><td className="px-4 py-3 font-bold text-slate-900">{w.name}</td><td className="px-4 py-3 text-slate-500">{w.assignedLine}</td><td className="px-4 py-3"><StatusBadge status={w.status} /></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'summary' && (
             <div className="space-y-8 animate-in fade-in">
               <div className="bg-slate-900 text-white p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2"><h3 className="text-2xl font-black uppercase tracking-tight">Deployment Pulse</h3></div>
                    <div className="flex gap-10">
                       <div className="text-center"><p className="text-3xl font-black text-emerald-400">{stats.allocation.present}</p><p className="text-[10px] font-black text-slate-500 uppercase">{t('direct_ops')}</p></div>
                       <div className="text-center"><p className="text-3xl font-black text-blue-400">{stats.allWorkers.length - stats.allocation.present - stats.allocation.absent}</p><p className="text-[10px] font-black text-slate-500 uppercase">{t('value_add')}</p></div>
                       <div className="text-center"><p className={`text-3xl font-black ${stats.allocation.absent > 0 ? 'text-rose-500' : 'text-white/20'}`}>{stats.allocation.absent}</p><p className="text-[10px] font-black text-slate-500 uppercase">{t('absent')}</p></div>
                    </div>
                 </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('core_production')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coreOpsConfigs.map(cfg => (
                      <div key={cfg.key} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-5"><div className={`p-4 rounded-xl ${cfg.bg} ${cfg.color}`}><cfg.icon size={22} /></div><div><h4 className="text-xs font-black text-slate-900 uppercase">{cfg.label}</h4><p className="text-[10px] text-slate-400 mt-0.5">{cfg.desc}</p></div></div>
                        <span className="text-2xl font-black text-slate-900">{(stats.allocation as any)[cfg.key]}</span>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('strategic_value_added')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {valueAddConfigs.map(cfg => {
                      const count = (stats.allocation as any)[cfg.key];
                      const pct = Math.round((count / stats.allWorkers.length) * 100);
                      return (
                        <div key={cfg.key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                             <div className={`p-3 rounded-xl ${cfg.bg} ${cfg.color}`}><cfg.icon size={18} /></div>
                             <span className="text-xl font-black text-slate-900">{count}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-900 uppercase">{cfg.label}</h4>
                          <p className="text-[9px] text-slate-400 font-medium mt-1 leading-tight">{cfg.desc}</p>
                          <div className="mt-5 space-y-1.5">
                             <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase"><span>Load</span><span>{pct}%</span></div>
                             <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                               <div className={`h-full ${cfg.bar} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
             </div>
          )}
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-xl flex flex-col min-h-[500px] border border-slate-800 shadow-2xl relative">
           <div className="flex items-center gap-2 mb-8"><Sparkles className="text-blue-400" size={20} /><h3 className="font-black text-lg">{t('ai_deployment_advisor')}</h3></div>
           {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in">
                 <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                 <h4 className="text-xs font-black uppercase">{t('calculating_mix')}</h4>
              </div>
           ) : aiSuggestions?.suggestions?.length > 0 ? (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                 {aiSuggestions.suggestions.map((s: any, idx: number) => (
                    <div key={idx} className={`p-4 bg-white/5 border border-white/10 rounded-xl border-l-4 ${s.executionMetadata?.action === 'MOVE' ? 'border-l-rose-500' : 'border-l-blue-500'}`}>
                       <h4 className="text-xs font-bold mb-1">{s.title}</h4>
                       <p className="text-[10px] text-slate-400 leading-relaxed mb-3">{s.description}</p>
                       <button onClick={() => handleExecute(s, idx)} className={`w-full py-2.5 rounded-lg font-black text-[10px] uppercase flex items-center justify-center gap-2 ${s.executionMetadata?.action === 'MOVE' ? 'bg-rose-600' : 'bg-blue-600'}`}>
                          {executingId === idx ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={14} />} 
                          {s.executionMetadata?.action === 'MOVE' ? t('execute_transfer') : t('accept_redeployed')}
                       </button>
                    </div>
                 ))}
              </div>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                <Users size={48} className="text-slate-500 mb-4" />
                <h4 className="font-bold uppercase text-xs">Ready for Deployment</h4>
              </div>
           )}
           <div className="mt-6 pt-6 border-t border-white/10"><button onClick={resetAll} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase">{t('reset_shift_state')}</button></div>
        </div>
      </div>
    </div>
  );
};

export default memo(LaborDashboard);
