
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { 
  Cpu, Activity, AlertTriangle, CheckCircle, CheckCircle2, Clock, 
  Zap, Hammer, Wrench, History, 
  ChevronRight, AlertCircle, DollarSign, Package, 
  Loader2, Sparkles, ShieldAlert, 
  FastForward, Info, Truck, ArrowRight, 
  ArrowRightLeft, X, Siren, RefreshCw, UserCheck, 
  ShieldCheck, Award, FileText, Settings,
  Target, Eye, PlayCircle, Shield, Monitor,
  Droplet, Briefcase, Award as Ribbon, 
  BarChart3, Layers, LayoutList, 
  Thermometer, ZapOff, Gauge, MousePointer2, Undo2,
  Wifi, Database, Server, Tool, Check as CheckSmall,
  MapPin, User, Search, ExternalLink, ChevronDown,
  ChevronUp, Star, ThumbsUp, ShieldHalf, Scale
} from 'lucide-react';
import { MOCK_MACHINES as INITIAL_MACHINES } from '../constants';
import { MachineStatus, ServiceSourcingAnalysis, RedistributionStep, LoadBalancingOption } from '../types';
import { getServiceSourcingAnalysis } from '../services/geminiService';

const SERVICE_STAGES: MachineStatus['serviceStage'][] = [
  'Dispatched',
  'Technician Assigned',
  'Diagnosis',
  'In Progress',
  'Quality Check',
  'Restored'
];

const MachineLiveTile: React.FC<{ 
  machine: MachineStatus; 
  onSelect: (m: MachineStatus) => void;
  onNavigateToService: (m: MachineStatus) => void;
}> = memo(({ machine, onSelect, onNavigateToService }) => {
  const telemetry = useMemo(() => {
    if (machine.id.startsWith('P')) return { label: 'FORCE', val: (Math.random() * 200 + 1800).toFixed(0), unit: 'kN' };
    if (machine.id.startsWith('LC')) return { label: 'GAS', val: (Math.random() * 2 + 10).toFixed(1), unit: 'Bar' };
    if (machine.id.startsWith('R')) return { label: 'CURR', val: (Math.random() * 5 + 45).toFixed(1), unit: 'A' };
    if (machine.id.startsWith('PB')) return { label: 'HUMID', val: (Math.random() * 5 + 40).toFixed(0), unit: '%' };
    if (machine.id.startsWith('AS')) return { label: 'TORQ', val: (Math.random() * 10 + 110).toFixed(0), unit: 'Nm' };
    return { label: 'UTIL', val: machine.utilization, unit: '%' };
  }, [machine.id, machine.utilization]);

  const isUnderService = !!machine.serviceStage;
  const isDown = machine.status === 'down';
  const isServiceDue = !isDown && !isUnderService && (machine.vibration !== 'normal' || machine.temp > 50);

  return (
    <div 
      className={`rounded-xl border shadow-sm p-3 transition-all relative group overflow-hidden cursor-pointer ${
        isDown ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/10' :
        isUnderService ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/10' :
        isServiceDue ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/10' :
        'bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg'
      }`}
      onClick={() => onSelect(machine)}
    >
      {/* Dynamic Status Badges for Command Center Visibility */}
      {isUnderService ? (
        <div className="absolute top-0 left-0 right-0 py-0.5 bg-blue-600 text-white flex items-center justify-center gap-1 z-10 animate-pulse">
          <RefreshCw size={8} className="animate-spin-slow" />
          <span className="text-[7px] font-black uppercase tracking-widest">{machine.serviceStage}</span>
        </div>
      ) : isDown ? (
        <div className="absolute top-0 left-0 right-0 py-0.5 bg-rose-600 text-white flex items-center justify-center gap-1 z-10">
          <Siren size={8} />
          <span className="text-[7px] font-black uppercase tracking-widest">Critical Breakdown</span>
        </div>
      ) : isServiceDue ? (
        <div className="absolute top-0 left-0 right-0 py-0.5 bg-amber-500 text-white flex items-center justify-center gap-1 z-10">
          <Clock size={8} />
          <span className="text-[7px] font-black uppercase tracking-widest">Service Due</span>
        </div>
      ) : null}

      <div className={`flex justify-between items-start mb-2 ${(isUnderService || isDown || isServiceDue) ? 'mt-3' : ''}`}>
        <div className="flex items-center space-x-1.5">
          <div className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
            machine.status === 'operational' ? 'bg-emerald-50 text-emerald-600' : 
            machine.status === 'maintenance' ? 'bg-amber-100 text-amber-600' : 
            'bg-rose-100 text-rose-600'
          }`}>
            <Cpu size={12} />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-[10px] truncate max-w-[80px] uppercase tracking-tighter leading-none">{machine.name}</h4>
            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{machine.id}</p>
          </div>
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${machine.status === 'operational' ? 'bg-emerald-500 animate-pulse' : machine.status === 'down' ? 'bg-rose-500' : 'bg-amber-500'}`} />
      </div>

      <div className="grid grid-cols-2 gap-1 mb-2">
        <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">
           <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter block leading-none mb-1">OEE</span>
           <div className="flex items-center gap-1">
             <span className="text-[10px] font-black text-slate-900 leading-none">{machine.oee}%</span>
           </div>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">
           <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter block leading-none mb-1">{telemetry.label}</span>
           <span className="text-[10px] font-black text-slate-900 leading-none">{telemetry.val}{telemetry.unit}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[7px] font-bold text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-50">
        <div className="flex items-center gap-1">
          <Thermometer size={8} className={machine.temp > 50 ? 'text-rose-500' : 'text-slate-400'} />
          <span>{machine.temp}°C</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity size={8} className={machine.vibration !== 'normal' ? 'text-amber-500' : 'text-slate-400'} />
          <span>{machine.vibration}</span>
        </div>
      </div>

      {/* Workflow Link: Immediate action for flagged assets */}
      {(isDown || isServiceDue || isUnderService) && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToService(machine);
          }}
          className="mt-2 w-full py-1.5 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-1 hover:bg-black transition-all group-hover:scale-[1.02]"
        >
          <span className="text-[7px] font-black uppercase tracking-widest">
            {isUnderService ? 'Track Progress' : 'Initiate Recovery'}
          </span>
          <ExternalLink size={8} />
        </button>
      )}
    </div>
  );
});

const LiveServiceTracker: React.FC<{ machine: MachineStatus }> = ({ machine }) => {
  const currentStageIndex = SERVICE_STAGES.indexOf(machine.serviceStage || 'Dispatched');

  return (
    <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col border border-white/5 animate-in fade-in zoom-in-95 duration-500">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none rotate-12"><Activity size={150} /></div>
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin-slow" /> Live Service Orchestrator
        </h4>
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
          {machine.serviceStage}
        </span>
      </div>

      <div className="space-y-8 relative py-4">
        <div className="absolute left-4 top-8 bottom-8 w-px bg-white/10" />
        <div 
          className="absolute left-4 top-8 w-px bg-blue-500 transition-all duration-1000 ease-in-out" 
          style={{ height: `${(currentStageIndex / (SERVICE_STAGES.length - 1)) * 100}%`, maxHeight: 'calc(100% - 64px)' }} 
        />

        {SERVICE_STAGES.map((stage, i) => {
          const isCompleted = i < currentStageIndex;
          const isCurrent = i === currentStageIndex;
          const isPending = i > currentStageIndex;

          return (
            <div key={stage} className={`flex items-start gap-4 transition-all duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                isCompleted ? 'bg-blue-600 border-blue-500 text-white' : 
                isCurrent ? 'bg-slate-900 border-blue-400 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 
                'bg-slate-900 border-white/10 text-white/20'
              }`}>
                {isCompleted ? <CheckSmall size={14} /> : <span className="text-[10px] font-black">{i + 1}</span>}
              </div>
              <div className="pt-1.5 flex-1">
                <div className="flex justify-between items-center">
                   <p className={`text-xs font-black uppercase tracking-tight ${isCurrent ? 'text-blue-400' : 'text-white'}`}>{stage}</p>
                   {isCurrent && <Clock size={10} className="text-blue-400 animate-pulse" />}
                </div>
                {isCurrent && (
                  <p className="text-[9px] text-white/50 mt-1 leading-relaxed animate-in fade-in slide-in-from-left-2">
                    {stage === 'Dispatched' && 'AI Service Ticket created and dispatched to logistics layer.'}
                    {stage === 'Technician Assigned' && 'External specialist Arvin K. (9.8/10) is en-route with spare components.'}
                    {stage === 'Diagnosis' && 'System diagnostic check underway. Sensor calibration in progress.'}
                    {stage === 'In Progress' && 'Mechanical repair sequence active. Parallel fleet load monitored.'}
                    {stage === 'Quality Check' && 'Restoration complete. Final safety and performance check initiated.'}
                    {stage === 'Restored' && 'Asset healthy. Syncing with global line controller...'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-white/5 rounded-2xl"><User size={16} className="text-blue-400" /></div>
            <div>
               <p className="text-[10px] font-black uppercase text-white">Technician</p>
               <p className="text-[9px] font-bold text-white/50">Arvin K. • Tata Auth.</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="p-3 bg-white/5 rounded-2xl"><MapPin size={16} className="text-emerald-400" /></div>
            <div>
               <p className="text-[10px] font-black uppercase text-white">Location</p>
               <p className="text-[9px] font-bold text-white/50">{machine.lineId} • Zone 4</p>
            </div>
         </div>
      </div>
    </div>
  );
};

const DashboardMachine: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initMessage, setInitMessage] = useState('Connecting to Edge Gateway...');
  const [subTab, setSubTab] = useState<'command' | 'service'>('command');
  const [machines, setMachines] = useState<MachineStatus[]>(INITIAL_MACHINES);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<'Regular' | 'Breakdown'>('Regular');
  const [loadingSourcing, setLoadingSourcing] = useState(false);
  const [sourcingAnalysis, setSourcingAnalysis] = useState<ServiceSourcingAnalysis | null>(null);
  const [selectedStrategyIndex, setSelectedStrategyIndex] = useState<number | null>(null);
  const [pendingBooking, setPendingBooking] = useState<{ vendorName: string, strategyIndex: number } | null>(null);
  const [showUndoPopup, setShowUndoPopup] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<number | null>(null);

  useEffect(() => {
    const messages = ['Establishing Secure MQTT Connection...', 'Synchronizing Edge Gateways...', 'Polling PLC Nodes...', 'Fetching Sensor Telemetry Data...'];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex++;
      if (msgIndex < messages.length) setInitMessage(messages[msgIndex]);
    }, 500);
    const timer = setTimeout(() => setIsInitializing(false), 2000);
    return () => { clearTimeout(timer); clearInterval(msgInterval); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMachines(prev => prev.map(m => {
        if (!m.serviceStage) return m;
        const currentIdx = SERVICE_STAGES.indexOf(m.serviceStage);
        if (currentIdx < SERVICE_STAGES.length - 1 && Math.random() > 0.85) {
          return { ...m, serviceStage: SERVICE_STAGES[currentIdx + 1] };
        }
        if (m.serviceStage === 'Restored' && Math.random() > 0.9) {
           return { ...m, serviceStage: undefined, status: 'operational', utilization: 85 };
        }
        return m;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const selectedMachine = useMemo(() => machines.find(m => m.id === selectedMachineId) || null, [selectedMachineId, machines]);

  const shopCategorization = useMemo(() => {
    return [
      { id: 'body', name: 'Body Shop (Press & Weld)', icon: Hammer, color: 'text-rose-600', lines: ['L1', 'L2'] },
      { id: 'paint', name: 'Paint Shop (Surface)', icon: Droplet, color: 'text-blue-600', lines: ['L3'] },
      { id: 'assembly', name: 'General Assembly', icon: Briefcase, color: 'text-indigo-600', lines: ['L4'] },
      { id: 'diag', name: 'Quality & Logistics', icon: Target, color: 'text-emerald-600', lines: ['L5', 'LOG'] },
    ].map(shop => ({ ...shop, machines: machines.filter(m => shop.lines.includes(m.lineId)) }));
  }, [machines]);

  const attentionRequired = useMemo(() => {
    const breakdowns = machines.filter(m => m.status === 'down');
    const pmDue = machines.filter(m => m.status === 'operational' && (m.vibration !== 'normal' || m.temp > 50));
    return { breakdowns, pmDue };
  }, [machines]);

  const fleetStats = useMemo(() => {
    const total = machines.length;
    const down = machines.filter(m => m.status === 'down').length;
    const avgOee = machines.reduce((acc, m) => acc + m.oee, 0) / total;
    return { total, down, avgOee };
  }, [machines]);

  const handleNavigateToService = useCallback((m: MachineStatus) => {
    setSelectedMachineId(m.id);
    setSelectedServiceType(m.status === 'down' ? 'Breakdown' : 'Regular');
    setSubTab('service');
    setSourcingAnalysis(null);
  }, []);

  const initiateOrchestration = async () => {
    if (!selectedMachine) return;
    setLoadingSourcing(true);
    setSelectedStrategyIndex(null);
    try {
      const analysis = await getServiceSourcingAnalysis(selectedMachine, selectedServiceType, selectedServiceType === 'Regular' ? 'Annual check. Bearing wear on primary axis.' : 'Catastrophic failure in hydraulic manifold.', machines);
      setSourcingAnalysis(analysis);
      if (analysis) setSelectedStrategyIndex(analysis.aiRecommendation.recommendedStrategyIndex);
    } finally { setLoadingSourcing(false); }
  };

  const handleMachineSelect = (m: MachineStatus) => {
    setSelectedMachineId(m.id);
    if (subTab === 'service') {
      setSourcingAnalysis(null);
      setPendingBooking(null);
      setSelectedServiceType(m.status === 'down' ? 'Breakdown' : 'Regular');
    }
  };

  const currentStrategy = sourcingAnalysis?.loadBalancingOptions[selectedStrategyIndex ?? 0];

  const handleBooking = (vendorName: string) => {
    if (selectedStrategyIndex === null) return;
    setPendingBooking({ vendorName, strategyIndex: selectedStrategyIndex });
    setShowUndoPopup(true);
  };

  const confirmBooking = () => {
    if (!pendingBooking || !selectedMachine || !currentStrategy) return;
    setMachines(prev => prev.map(m => {
      if (m.id === selectedMachine.id) {
        return { ...m, status: selectedServiceType === 'Regular' ? 'maintenance' : 'down', currentLoadUnitsHr: 0, utilization: 0, serviceStage: 'Dispatched' };
      }
      const step = currentStrategy.steps.find(s => s.targetMachineId === m.id);
      if (step) return { ...m, currentLoadUnitsHr: m.currentLoadUnitsHr + step.additionalLoadUnits, utilization: step.newUtilization };
      return m;
    }));
    setSourcingAnalysis(null);
    setPendingBooking(null);
    setShowUndoPopup(false);
  };

  if (isInitializing) {
    return (
      <div className="h-[70vh] w-full bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center overflow-hidden relative border border-white/5">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 space-y-8 flex flex-col items-center">
          <div className="p-8 bg-blue-600/10 text-blue-500 rounded-[2rem] border border-blue-500/20 animate-pulse"><Wifi size={48} /></div>
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">{initMessage}</h3>
            <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-blue-600 animate-[loading_2s_ease-in-out_forwards]" />
            </div>
          </div>
        </div>
        <style>{`@keyframes loading { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-700 pb-20 relative border-l-4 border-slate-900/5 pl-4">
      {showUndoPopup && pendingBooking && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md animate-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg"><CheckSmall size={20} /></div>
              <div><p className="text-xs font-black uppercase">Service Booked with {pendingBooking.vendorName}</p><p className="text-[10px] text-slate-400 font-bold uppercase">Click Confirm to synchronize line load</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setPendingBooking(null); setShowUndoPopup(false); }} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5"><Undo2 size={12} /> Undo</button>
              <button onClick={confirmBooking} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-[9px] font-black uppercase transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10"><Monitor size={20} /></div>
             <div><h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Global Telemetry Hub</h2><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Intelligence Systems</p></div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
             <button onClick={() => setSubTab('command')} className={`px-5 py-2 rounded-lg font-black text-[10px] transition-all uppercase tracking-widest flex items-center gap-2 ${subTab === 'command' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}><Activity size={12} /> Command Center</button>
             <button onClick={() => setSubTab('service')} className={`px-5 py-2 rounded-lg font-black text-[10px] transition-all uppercase tracking-widest flex items-center gap-2 ${subTab === 'service' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}><ShieldAlert size={12} /> Service Intel</button>
          </div>
        </div>
        <div className="px-6 py-2.5 bg-slate-50/50 flex flex-wrap gap-8 items-center border-t border-slate-50">
           <div className="flex items-center gap-4"><div><p className="text-[8px] font-black text-slate-400 uppercase leading-none">Global OEE</p><p className="text-xs font-black text-slate-900">{fleetStats.avgOee.toFixed(1)}%</p></div><div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${fleetStats.avgOee}%` }} /></div></div>
           <div className="flex items-center gap-6"><div><p className="text-[8px] font-black text-slate-400 uppercase leading-none">Fleet Size</p><p className="text-xs font-black text-slate-900">{fleetStats.total} Assets</p></div><div className="flex items-center gap-4"><div className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded border border-rose-100"><p className="text-[8px] font-black uppercase leading-none">Down</p><p className="text-xs font-black">{fleetStats.down}</p></div><div className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-100"><p className="text-[8px] font-black uppercase leading-none">Due</p><p className="text-xs font-black">{attentionRequired.pmDue.length}</p></div></div></div>
        </div>
      </div>

      {subTab === 'command' ? (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          {shopCategorization.map(shop => (
            <div key={shop.id} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className={`p-1 rounded-lg bg-slate-100 ${shop.color}`}><shop.icon size={12} /></div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{shop.name}</h3>
                <div className="flex-1 border-t border-slate-100 ml-2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                {shop.machines.map(m => (
                  <MachineLiveTile key={m.id} machine={m} onSelect={handleMachineSelect} onNavigateToService={handleNavigateToService} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-right-4 duration-500">
          <div className="lg:col-span-3 space-y-4">
             <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
                <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.1em] mb-4 flex items-center gap-2 border-b border-rose-100 pb-3"><Siren size={14} /> Attention Queue</h3>
                <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1 custom-scrollbar">
                   {attentionRequired.breakdowns.map(m => (
                      <div key={m.id} onClick={() => handleMachineSelect(m)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedMachine?.id === m.id ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-rose-50 border-rose-100 text-rose-900 hover:bg-rose-100'}`}>
                         <div className="flex justify-between items-start"><p className="text-xs font-black uppercase leading-tight">{m.name}</p><AlertTriangle size={12} className={selectedMachine?.id === m.id ? 'text-white' : 'text-rose-400'} /></div>
                         <p className={`text-[9px] font-bold mt-1 uppercase ${selectedMachine?.id === m.id ? 'text-white/60' : 'text-rose-400'}`}>Critical Breakdown • {m.lineId}</p>
                      </div>
                   ))}
                   <div className="pt-2 border-t border-slate-50" />
                   {attentionRequired.pmDue.map(m => (
                      <div key={m.id} onClick={() => handleMachineSelect(m)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedMachine?.id === m.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-amber-50 border-amber-100 text-amber-900 hover:bg-amber-100'}`}>
                         <div className="flex justify-between items-start"><p className="text-xs font-black uppercase leading-tight">{m.name}</p><Clock size={12} className={selectedMachine?.id === m.id ? 'text-white' : 'text-amber-400'} /></div>
                         <p className={`text-[9px] font-bold mt-1 uppercase ${selectedMachine?.id === m.id ? 'text-white/60' : 'text-amber-500'}`}>PM Cycle Threshold • {m.id}</p>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="lg:col-span-9">
            {!selectedMachine ? (
              <div className="h-full bg-white rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-20 text-center">
                 <div className="p-8 bg-slate-50 rounded-full text-slate-200 mb-6 shadow-inner"><MousePointer2 size={48} /></div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Select Asset from Queue</h3>
                 <p className="text-slate-400 text-[10px] font-bold uppercase mt-2">Initialize deep-dive sourcing and load-balancing simulation</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between gap-6 items-center">
                   <div className="flex items-center gap-5">
                      <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl"><Settings size={28} /></div>
                      <div>
                         <div className="flex items-center gap-3">
                           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedMachine.name}</h3>
                           {selectedMachine.isUnderWarranty && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-600 rounded-full"><Ribbon size={10} /><span className="text-[8px] font-black uppercase">Active Warranty</span></div>}
                         </div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {selectedMachine.status} • Line: {selectedMachine.lineId}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-1.5 rounded-2xl flex border border-slate-200 shadow-inner">
                        <button onClick={() => setSelectedServiceType('Regular')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${selectedServiceType === 'Regular' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Scheduled PM</button>
                        <button onClick={() => setSelectedServiceType('Breakdown')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${selectedServiceType === 'Breakdown' ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}>Emergency Repair</button>
                      </div>
                      <button onClick={initiateOrchestration} disabled={loadingSourcing} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50">
                         {loadingSourcing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                         Run AI Analysis
                      </button>
                   </div>
                </div>

                {selectedMachine.serviceStage ? (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-8"><LiveServiceTracker machine={selectedMachine} /></div>
                    <div className="xl:col-span-4 space-y-4 animate-in slide-in-from-right-4 duration-500">
                       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Line Status Impact</h4>
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3"><CheckSmall className="text-emerald-600" size={16} /><p className="text-[10px] font-bold text-emerald-800 leading-tight uppercase">Load Successfully redistributed to Parallel Assets</p></div>
                       </div>
                    </div>
                  </div>
                ) : sourcingAnalysis ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
                    {/* ENHANCED STRATEGY SECTION */}
                    <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col border border-white/5">
                       <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-white/5 pb-4"><Scale size={14} /> Multi-Variable Recovery Strategy</h4>
                       
                       <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Sparkles size={10}/> AI Strategy Reasoning</p>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-medium italic">"{sourcingAnalysis.aiRecommendation.strategyReasoning}"</p>
                       </div>

                       <div className="flex flex-col gap-3 mb-8 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                          {sourcingAnalysis.loadBalancingOptions.map((opt, i) => (
                             <div key={i} className="space-y-2">
                                <button 
                                  onClick={() => {
                                    setSelectedStrategyIndex(i);
                                    setExpandedReasoning(expandedReasoning === i ? null : i);
                                  }} 
                                  className={`w-full p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${selectedStrategyIndex === i ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                   <div className="flex justify-between items-center mb-1">
                                      <p className="text-xs font-black uppercase tracking-tight">{opt.strategyName}</p>
                                      {sourcingAnalysis.aiRecommendation.recommendedStrategyIndex === i && <span className="px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black uppercase">AI Best Match</span>}
                                   </div>
                                   <p className="text-[10px] text-white/60 line-clamp-1">{opt.description}</p>
                                   <div className="flex items-center gap-3 mt-3">
                                      <div className="flex items-center gap-1 text-[8px] font-black uppercase"><Activity size={10}/> OEE: {opt.projectedLineOEE}%</div>
                                      <div className="flex items-center gap-1 text-[8px] font-black uppercase"><Target size={10}/> T-PUT: {opt.projectedLineThroughput}U/H</div>
                                   </div>
                                </button>
                                {expandedReasoning === i && (
                                   <div className="p-4 bg-white/5 border border-white/10 rounded-2xl animate-in slide-in-from-top-2 text-[10px] leading-relaxed text-slate-400 font-medium">
                                      <p className="text-blue-300 font-black uppercase mb-2 tracking-widest flex items-center gap-2"><Info size={10}/> Technical Rationale</p>
                                      {opt.reasoning}
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>

                       {currentStrategy && (
                          <div className="flex-1 space-y-6">
                             <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest">Fleet Simulation Results</p>
                                <div className="space-y-5">
                                   {currentStrategy.steps.map((step, i) => (
                                      <div key={i} className="relative z-10 space-y-2">
                                         <div className="flex justify-between items-end">
                                            <div><p className="text-xs font-black uppercase text-white">{step.targetMachineId}</p></div>
                                            <div className="text-right">
                                               <p className={`text-xs font-black ${step.newUtilization > 95 ? 'text-rose-400' : 'text-emerald-400'}`}>{step.newUtilization}% Utilization</p>
                                               <p className="text-[8px] text-white/30 uppercase">+{step.additionalLoadUnits} Units/Hr Shift</p>
                                            </div>
                                         </div>
                                         <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5"><div className={`h-full transition-all duration-700 ease-out bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]`} style={{ width: `${step.newUtilization}%` }} /></div>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       )}
                    </div>

                    {/* ENHANCED VENDOR SECTION */}
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
                       <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5">
                          <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Briefcase size={14} className="text-blue-500" /> Procurement Decision Matrix</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Sourced & Verified Service Bids</p>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                             <ShieldHalf size={14} className="text-blue-600" />
                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Decision Support Active</span>
                          </div>
                       </div>

                       {/* AI Vendor Recommendation Box */}
                       <div className="mb-8 p-5 bg-blue-50 border border-blue-100 rounded-[2rem] relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 text-blue-100"><Star size={60} /></div>
                          <div className="relative z-10">
                             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2"><ThumbsUp size={14} /> Recommended Vendor: {sourcingAnalysis.vendorEstimates[sourcingAnalysis.aiRecommendation.recommendedVendorIndex]?.vendorName}</p>
                             <p className="text-xs text-blue-800 leading-relaxed font-medium italic">"{sourcingAnalysis.aiRecommendation.vendorReasoning}"</p>
                          </div>
                       </div>

                       <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                          {sourcingAnalysis.vendorEstimates.map((v, i) => (
                             <div key={i} className={`p-6 rounded-[2rem] border transition-all relative group ${sourcingAnalysis.aiRecommendation.recommendedVendorIndex === i ? 'border-blue-500 ring-2 ring-blue-500/10 bg-white shadow-xl' : 'bg-slate-50 border-slate-100 opacity-80 hover:opacity-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                   <div>
                                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{v.vendorName}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                         <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, idx) => <Star key={idx} size={10} fill={idx < Math.round(v.reputationScore / 2) ? '#2563eb' : 'none'} className={idx < Math.round(v.reputationScore / 2) ? 'text-blue-600' : 'text-slate-300'} />)}</div>
                                         <span className="text-[9px] font-black text-slate-400 uppercase">({v.reputationScore}/10 Score)</span>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-xl font-black text-slate-900">₹{v.repairEstimateINR.toLocaleString()}</p>
                                      <p className="text-[8px] font-black text-slate-400 uppercase">Flat-Rate Estimate</p>
                                   </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                   <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3">
                                      <Clock size={16} className="text-blue-500" />
                                      <div><p className="text-[8px] font-black text-slate-400 uppercase">Timeline</p><p className="text-[10px] font-bold text-slate-900">{v.completionTime}</p></div>
                                   </div>
                                   <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3">
                                      <Shield size={16} className="text-emerald-500" />
                                      <div><p className="text-[8px] font-black text-slate-400 uppercase">Warranty</p><p className="text-[10px] font-bold text-slate-900">{v.warrantyMonths} Months</p></div>
                                   </div>
                                </div>

                                <p className="text-[10px] text-slate-500 italic leading-relaxed mb-6 border-l-2 border-slate-200 pl-4">{v.description}</p>
                                
                                <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                                   {v.voidsWarranty ? (
                                      <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-500 border border-rose-100 rounded-lg">
                                         <ZapOff size={12} />
                                         <span className="text-[8px] font-black uppercase tracking-widest">Voids OEM Warranty</span>
                                      </div>
                                   ) : (
                                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                                         <CheckSmall size={14} />
                                         <span className="text-[8px] font-black uppercase tracking-widest">OEM Certified</span>
                                      </div>
                                   )}
                                   <button 
                                     onClick={() => handleBooking(v.vendorName)} 
                                     className={`px-8 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${sourcingAnalysis.aiRecommendation.recommendedVendorIndex === i ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                                   >
                                     Book & Sync
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                       
                       <div className="mt-8 bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center justify-between">
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Financial Impact (Do Nothing)</p>
                             <p className="text-xl font-black text-rose-600">₹{sourcingAnalysis.financialImpact.doNothingLossINR.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Mitigated Efficiency Loss</p>
                             <p className="text-xl font-black text-emerald-600">₹{(sourcingAnalysis.financialImpact.doNothingLossINR - sourcingAnalysis.financialImpact.mitigationCostINR).toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(DashboardMachine);
