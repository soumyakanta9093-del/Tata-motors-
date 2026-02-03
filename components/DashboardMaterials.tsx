
import React, { useState, useMemo, useCallback, memo } from 'react';
import { CSV_DATA } from '../constants';
import { getMaterialOptimizationSuggestion, getDemandSurgeAnalysis, getLogisticsDisruptionAnalysis } from '../services/materialService';
import { 
  Search, Factory, ShieldCheck, 
  RefreshCcw, Warehouse, ClipboardList, Sparkles,
  TrendingUp, AlertTriangle, Truck, Mail, 
  CheckCircle, ArrowUpRight, DollarSign, Clock,
  ChevronRight, X, Siren, FileText, Globe, Zap, Plane, Train,
  Loader2, ExternalLink, Package, UserCheck, MapPin, Navigation,
  ShieldAlert, FastForward, Activity, Info, CheckCircle2
} from 'lucide-react';

const DashboardMaterials: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [surgeLoading, setSurgeLoading] = useState(false);
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [surgeResult, setSurgeResult] = useState<any>(null);
  const [logisticsResult, setLogisticsResult] = useState<any>(null);
  const [showSurgeModal, setShowSurgeModal] = useState(false);
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [surgeModel, setSurgeModel] = useState('Nexon');
  const [surgeMagnitude, setSurgeMagnitude] = useState(30);
  const [selectedVendors, setSelectedVendors] = useState<Record<string, number>>({});

  const stats = useMemo(() => {
    const lines = ['Curvv', 'Nexon', 'Altroz', 'Safari'];
    const lStats = lines.map(line => {
      const parts = CSV_DATA.filter(p => p.Model.includes(line));
      const criticalParts = parts.filter(p => p.OnHandQty < p.SafetyStock);
      return { 
        name: line, 
        totalParts: parts.length, 
        criticalCount: criticalParts.length, 
        status: criticalParts.length > 0 ? 'Risk' : 'Stable' 
      };
    });
    return { lStats, isAnyLineCritical: lStats.some(l => l.status === 'Risk') };
  }, []);

  const filteredParts = useMemo(() => {
    return CSV_DATA.filter(p => 
      p.ComponentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ComponentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const runAiAdvisor = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await getMaterialOptimizationSuggestion(CSV_DATA, "General inventory audit required.");
      setAiSuggestions(result);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const runSurgeSimulation = async () => {
    setSurgeLoading(true);
    try {
      const result = await getDemandSurgeAnalysis(surgeModel, surgeMagnitude, CSV_DATA);
      setSurgeResult(result);
      setSelectedVendors({});
      setShowSurgeModal(true);
    } finally {
      setSurgeLoading(false);
    }
  };

  const runLogisticsDisruption = async () => {
    setLogisticsLoading(true);
    try {
      const result = await getLogisticsDisruptionAnalysis({ componentName: "ABS Module", issue: "Landslide NH-48" });
      setLogisticsResult(result);
      setShowLogisticsModal(true);
    } finally {
      setLogisticsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Material Control Tower</h2>
          <div className={`mt-1 flex items-center space-x-2 text-[10px] font-black uppercase ${stats.isAnyLineCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
            <ShieldCheck size={14} />
            <span className="tracking-widest">{stats.isAnyLineCritical ? 'Supply Breach Detected' : 'Supply Health Normal'}</span>
          </div>
        </div>
        <button onClick={runAiAdvisor} disabled={loading} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20">
          {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>GLOBAL AI AUDIT</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between gap-4 group hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20"><Siren size={24} /></div>
            <div><h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Demand Surge Simulator</h4><p className="text-xs text-amber-700 font-medium">Test supply chain elasticity for market spikes.</p></div>
          </div>
          <button onClick={runSurgeSimulation} disabled={surgeLoading} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            {surgeLoading ? <Loader2 size={14} className="animate-spin" /> : <FastForward size={14} />} SIMULATE
          </button>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-center justify-between gap-4 group hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20"><Navigation size={24} /></div>
            <div><h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Logistics Disruption Control</h4><p className="text-xs text-rose-700 font-medium">Mitigate NH-48 / Port delays in real-time.</p></div>
          </div>
          <button onClick={runLogisticsDisruption} disabled={logisticsLoading} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            {logisticsLoading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />} MANAGE
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

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 text-white rounded-lg"><ClipboardList size={18} /></div>
             <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Inventory Diagnostic Ledger</h3>
          </div>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Filter SKU or Model..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full md:w-64 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
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
              {filteredParts.map((p) => {
                const isCritical = p.OnHandQty < p.SafetyStock;
                const healthPercent = Math.min(100, Math.round((p.OnHandQty / (p.SafetyStock * 1.5)) * 100));
                return (
                  <tr key={p.ComponentCode} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 text-xs">{p.ComponentCode}</td>
                    <td className="px-6 py-4"><p className="text-xs font-black text-slate-900">{p.ComponentName}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{p.Module}</p></td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-wider">{p.Model}</span></td>
                    <td className="px-6 py-4 font-black text-slate-900 text-xs">{p.OnHandQty} {p.UoM}</td>
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
      </div>

      {/* Demand Surge Modal */}
      {showSurgeModal && surgeResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="bg-amber-600 p-8 text-white flex justify-between items-start">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3"><TrendingUp size={28} /> Demand Surge Analysis</h3>
                   <p className="text-amber-100 text-sm font-medium mt-1">Impact simulation for +{surgeMagnitude}% volume in {surgeModel} production</p>
                </div>
                <button onClick={() => setShowSurgeModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={24} /></button>
             </div>
             <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Projected Supply Deficits</h4>
                   <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                      {surgeResult.impactedComponents?.map((comp: any) => (
                        <div key={comp.code} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                           <div><p className="text-xs font-black text-slate-900">{comp.name}</p><p className="text-[10px] text-rose-600 font-bold uppercase">Deficit: {comp.deficit}</p></div>
                           <div className="text-right"><p className="text-xs font-bold text-slate-500">Stockout</p><p className="text-[10px] font-black uppercase text-slate-900">{comp.daysToStockout} Days</p></div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col h-full">
                   <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">AI Sourcing Allocation</h4>
                   <div className="flex-1 space-y-4">
                      {surgeResult.mitigationStrategies?.map((s: any, idx: number) => (
                         <div key={idx} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl h-fit"><Warehouse size={20} /></div>
                            <div><p className="text-xs font-black text-slate-900 uppercase tracking-tight">{s.vendorName}</p><p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">{s.action}</p></div>
                         </div>
                      ))}
                   </div>
                   <button className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Execute Sourcing Mix</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Logistics Disruption Modal */}
      {showLogisticsModal && logisticsResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-600/20"><AlertTriangle size={24} /></div>
                   <div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Logistics Disruption: NH-48</h3><p className="text-xs text-slate-500 font-medium mt-0.5">Affected Component: ABS Module (Braking)</p></div>
                </div>
                <button onClick={() => setShowLogisticsModal(false)} className="text-slate-400 hover:text-rose-500"><X size={24} /></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                   <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center"><p className="text-[10px] font-black text-slate-400 uppercase">Impacted units</p><p className="text-xl font-black text-slate-900 mt-1">450</p></div>
                   <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center"><p className="text-[10px] font-black text-slate-400 uppercase">Time to stockout</p><p className="text-xl font-black text-rose-600 mt-1">12h</p></div>
                   <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center"><p className="text-[10px] font-black text-slate-400 uppercase">Recovery Slot</p><p className="text-xl font-black text-slate-900 mt-1">Shift B</p></div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><Plane size={60} /></div>
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">AI Mitigation Route</h4>
                   <p className="text-xs text-slate-300 leading-relaxed font-medium">{logisticsResult.mitigation}</p>
                   <div className="mt-6 flex gap-4">
                      <button className="flex-1 py-3 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-colors">Confirm Air Freight</button>
                      <button className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-colors">Check Local Buffer</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(DashboardMaterials);
