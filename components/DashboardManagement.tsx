
import React, { memo, useMemo, useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line 
} from 'recharts';
import { 
  Target, Clock, Activity, DollarSign, Zap, TrendingUp, 
  TrendingDown, Globe, ChevronRight, Info, AlertCircle
} from 'lucide-react';

// --- SUB-COMPONENTS ---

const MiniSparkline = memo(({ data, color }: { data: any[], color: string }) => (
  <div className="h-8 w-16 opacity-50 group-hover:opacity-100 transition-opacity">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line 
          type="monotone" 
          dataKey="val" 
          stroke={color} 
          strokeWidth={2} 
          dot={false} 
          isAnimationActive={false} 
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
));

const KPICard = memo(({ title, value, subValue, icon: Icon, color, trend, sparkData }: any) => {
  const colorMap: Record<string, string> = {
    blue: '#2563eb',
    indigo: '#4f46e5',
    sky: '#0ea5e9',
    amber: '#d97706'
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 group cursor-default">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600 group-hover:bg-${color}-600 group-hover:text-white transition-colors`}>
          <Icon size={20} />
        </div>
        <div className="flex flex-col items-end">
          <div className={`flex items-center text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {subValue}
          </div>
          <MiniSparkline data={sparkData} color={colorMap[color] || '#cbd5e1'} />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</h3>
        <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
});

const LiveTicker = memo(() => {
  const [messages] = useState([
    "Line 1: Batch NEXON-EV-102 Initiated",
    "Line 4: Maintenance Cycle Completed",
    "QC Alert: Curvv-09 Passed High Voltage Test",
    "Logistics: 200kg BMS Components Received",
    "Shift Update: Productivity tracking 4% above target"
  ]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="flex items-center space-x-3 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 h-10 overflow-hidden">
      <div className="flex items-center space-x-2 shrink-0 border-r border-slate-700 pr-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Feed</span>
      </div>
      <p className="text-xs font-medium text-slate-300 animate-in slide-in-from-bottom-2 duration-500 truncate" key={index}>
        {messages[index]}
      </p>
    </div>
  );
});

const DashboardManagement: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'D' | 'W' | 'M'>('D');

  const performanceData = useMemo(() => {
    const daily = [
      { name: '08:00', actual: 88, target: 90 },
      { name: '10:00', actual: 92, target: 90 },
      { name: '12:00', actual: 85, target: 90 },
      { name: '14:00', actual: 95, target: 90 },
      { name: '16:00', actual: 94, target: 90 },
    ];
    const weekly = [
      { name: 'Mon', actual: 92, target: 90 },
      { name: 'Tue', actual: 95, target: 90 },
      { name: 'Wed', actual: 88, target: 90 },
      { name: 'Thu', actual: 98, target: 90 },
      { name: 'Fri', actual: 94, target: 90 },
    ];
    return timeRange === 'D' ? daily : weekly;
  }, [timeRange]);

  const marginData = useMemo(() => [
    { name: 'Curvv EV', value: 55000 },
    { name: 'Safari', value: 65000 },
    { name: 'Nexon EV', value: 52000 },
    { name: 'Altroz', value: 28000 },
  ], []);

  const COLORS = useMemo(() => ['#4f46e5', '#2563eb', '#0ea5e9', '#6366f1'], []);

  // Simulated sparkline data
  const sparkData = useMemo(() => Array.from({ length: 7 }).map(() => ({ val: Math.random() * 100 })), []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Management Overview</h2>
          <p className="text-slate-500 text-sm font-medium">Holistic production health & financial tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <LiveTicker />
          <div className="flex bg-slate-200 p-1 rounded-lg">
            {(['D', 'W', 'M'] as const).map(range => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-[10px] font-black rounded transition-all ${
                  timeRange === range ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="OTIF Accuracy" value="94.2%" subValue="+2.1%" icon={Target} color="blue" trend="up" sparkData={sparkData} />
        <KPICard title="Schedule Adh." value="92.8%" subValue="-1.4%" icon={Clock} color="indigo" trend="down" sparkData={sparkData} />
        <KPICard title="Line Efficiency" value="88.5%" subValue="+0.5%" icon={Activity} color="sky" trend="up" sparkData={sparkData} />
        <KPICard title="Daily Margin" value="₹4.2M" subValue="+12.0%" icon={DollarSign} color="amber" trend="up" sparkData={sparkData} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Throughput Stability Index</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Output vs. Planned Target</p>
            </div>
            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-blue-600" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Actual</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-slate-200" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Target</span>
               </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">Product Margin Mix</h3>
          <p className="text-[10px] text-slate-400 font-bold mb-6 uppercase">Revenue contribution by model</p>
          
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marginData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                >
                  {marginData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
               <p className="text-2xl font-black text-slate-900">₹4.2M</p>
               <p className="text-[8px] text-slate-400 font-bold uppercase">Total Day</p>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            {marginData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 text-xs">₹{(item.value / 1000).toFixed(0)}k</span>
                  <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                    <div className="h-full" style={{ backgroundColor: COLORS[index], width: '60%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Breach Notification */}
      <div className="bg-indigo-600 p-8 rounded-2xl text-white flex flex-col lg:flex-row items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Globe size={160} />
        </div>
        <div className="mb-6 lg:mb-0 relative z-10 flex items-center space-x-6">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
            <Zap size={32} className="text-amber-300 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xl font-black flex items-center gap-2 tracking-tight">
              Production Constraint Detected
            </h4>
            <p className="text-indigo-100 mt-1 max-w-lg text-sm font-medium">
              Material shortage on Part BAT-2000 (BMS Controller) is impacting Curvv EV final assembly. Shutdown risk in 14 cycles.
            </p>
          </div>
        </div>
        <div className="flex space-x-4 relative z-10">
          <button className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-black hover:bg-indigo-50 transition-all active:scale-95 text-xs uppercase tracking-wider">
            <span>INITIATE MIP SOLVER</span>
            <ChevronRight size={16} />
          </button>
          <button className="p-3 bg-indigo-500 rounded-xl hover:bg-indigo-400 transition-colors" aria-label="Details">
            <Info size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(DashboardManagement);
