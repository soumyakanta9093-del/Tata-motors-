
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
  Wifi, Database, Server, Check as CheckSmall,
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

// --- SUB-COMPONENTS ---

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

// Fixed component definition and added missing logic
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

  // Fixed shorthand property error and added missing logic
  const confirmBooking = () => {
    if (!pendingBooking || !selectedMachine || !currentStrategy) return;
    setMachines(prev => prev.map(m => {
      if (m.id === selectedMachine.id) {
        return { ...m, status: selectedServiceType === 'Regular' ? 'maintenance' : 'down', currentLoadUnitsHr: 0, utilization: 0, serviceStage: 'Dispatched' };
      }
      const step = currentStrategy.steps.find(s => s.targetMachineId === m.id);
      if (step) return { 
        ...m, 
        currentLoadUnitsHr: m.currentLoadUnitsHr + step.additionalLoadUnits,
        utilization: step.newUtilization 
      };
      return m;
    }));
    setShowUndoPopup(false);
    setPendingBooking(null);
  };

  if (isInitializing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8 h-full bg-slate-50/50">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{initMessage}</h4>
          <p className="text-slate-500 text-sm font-medium">Establishing secure industrial mesh... syncing sensor nodes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Machine Command Center</h2>
          <div className="flex gap-4 mt-1">
             <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-blue-600">
               <Monitor size={14} /> <span>Fleet Status: {fleetStats.total - fleetStats.down}/{fleetStats.total} Online</span>
             </div>
             <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-emerald-600">
               <ShieldCheck size={14} /> <span>Avg OEE: {fleetStats.avgOee.toFixed(1)}%</span>
             </div>
          </div>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-xl border border-slate-200 shadow-sm">
           <button onClick={() => setSubTab('command')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${subTab === 'command' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Fleet Control</button>
           <button onClick={() => setSubTab('service')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${subTab === 'service' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Service Hub</button>
        </div>
      </div>

      {subTab === 'command' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <div className="lg:col-span-3 space-y-8">
              {shopCategorization.map(shop => (
                 <div key={shop.id} className="space-y-4">
                    <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${shop.color}`}>
                       <shop.icon size={16} /> {shop.name}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {shop.machines.map(m => (
                          <MachineLiveTile 
                            key={m.id} 
                            machine={m} 
                            onSelect={handleMachineSelect} 
                            onNavigateToService={handleNavigateToService} 
                          />
                       ))}
                    </div>
                 </div>
              ))}
           </div>
           <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Attention Required</h4>
                 <div className="space-y-3">
                    {attentionRequired.breakdowns.map(m => (
                       <div key={m.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
                          <AlertTriangle className="text-rose-600" size={16} />
                          <div><p className="text-[10px] font-black text-slate-900 leading-none">{m.name}</p><p className="text-[8px] font-bold text-rose-600 uppercase mt-1">Breakdown</p></div>
                       </div>
                    ))}
                    {attentionRequired.pmDue.map(m => (
                       <div key={m.id} className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                          <Settings className="text-amber-600" size={16} />
                          <div><p className="text-[10px] font-black text-slate-900 leading-none">{m.name}</p><p className="text-[8px] font-bold text-amber-600 uppercase mt-1">Service Due</p></div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col">
           <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20"><Wrench size={24} /></div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Service Orchestrator</h3>
                    <p className="text-xs text-slate-500 font-medium">Sourcing, Load Balancing & Recovery Workflow</p>
                 </div>
              </div>
           </div>
           
           <div className="flex-1 p-8">
              {selectedMachine ? (
                 selectedMachine.serviceStage ? (
                    <LiveServiceTracker machine={selectedMachine} />
                 ) : (
                    <div className="space-y-8">
                       <div className="p-6 bg-slate-900 rounded-2xl text-white flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-blue-500/20 rounded-xl"><Cpu className="text-blue-400" size={24} /></div>
                             <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Selected Asset</p>
                                <h4 className="text-lg font-black uppercase">{selectedMachine.name}</h4>
                             </div>
                          </div>
                          <button onClick={initiateOrchestration} disabled={loadingSourcing} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2">
                             {loadingSourcing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                             <span>Analyze Recovery Path</span>
                          </button>
                       </div>
                       
                       {sourcingAnalysis && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                             <div className="space-y-6">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Load Re-routing Strategies</h5>
                                <div className="space-y-4">
                                   {sourcingAnalysis.loadBalancingOptions.map((opt, idx) => (
                                      <div key={idx} onClick={() => setSelectedStrategyIndex(idx)} className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedStrategyIndex === idx ? 'bg-blue-50 border-blue-600 shadow-lg' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                         <div className="flex justify-between items-start mb-2">
                                            <h6 className="font-black text-xs uppercase text-slate-900">{opt.strategyName}</h6>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${opt.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{opt.riskLevel} Risk</span>
                                         </div>
                                         <p className="text-[10px] text-slate-500 leading-relaxed">{opt.description}</p>
                                      </div>
                                   ))}
                                </div>
                             </div>
                             
                             <div className="space-y-6">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Service Vendors</h5>
                                <div className="space-y-4">
                                   {sourcingAnalysis.vendorEstimates.map((v, idx) => (
                                      <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                                         <div>
                                            <h6 className="font-black text-xs uppercase text-slate-900">{v.vendorName}</h6>
                                            <p className="text-[10px] text-slate-500 mt-1">₹{v.repairEstimateINR.toLocaleString()} • {v.completionTime}</p>
                                         </div>
                                         <button onClick={() => handleBooking(v.vendorName)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black">Book Now</button>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                 )
              ) : (
                 <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300">
                    <Monitor size={64} className="mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-sm">Select an Asset to Begin Orchestration</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {showUndoPopup && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-6 border border-white/10 animate-in slide-in-from-bottom-8">
           <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-400" size={20} />
              <p className="text-sm font-bold">Booking {pendingBooking?.vendorName}...</p>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => setShowUndoPopup(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors">Undo</button>
              <button onClick={confirmBooking} className="px-4 py-2 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Confirm Execution</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default memo(DashboardMachine);
