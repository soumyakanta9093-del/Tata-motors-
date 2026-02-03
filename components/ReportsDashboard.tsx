
import React, { useMemo, useState, memo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart, Bar, Line
} from 'recharts';
import { 
  Users, Cpu, Clock, Activity, Package,
  History, Award, Siren, Truck
} from 'lucide-react';
import { CSV_DATA, MOCK_MACHINES } from '../constants';
import { Worker, ProductionLine } from '../types';

const COLORS = ['#2563eb', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

interface ReportsDashboardProps {
  laborPool: Worker[];
  activeLines: ProductionLine[];
  productionStats: { planned: number; actual: number; percent: number };
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ laborPool, productionStats }) => {
  const [dateRange, setDateRange] = useState<'Shift' | '24H' | '7D' | '30D' | 'Custom'>('Shift');

  // --- OPTIMIZED TEMPORAL ENGINE ---
  const reportContext = useMemo(() => {
    let labels: string[] = [];
    let multiplier = 1;
    let noiseFactor = 0.1;
    let savingsScale = 1;

    switch (dateRange) {
      case 'Shift':
        labels = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
        multiplier = 1;
        noiseFactor = 0.15;
        savingsScale = 1 / 1095;
        break;
      case '24H':
        labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
        multiplier = 3;
        noiseFactor = 0.2;
        savingsScale = 1 / 365;
        break;
      case '7D':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        multiplier = 21;
        noiseFactor = 0.1;
        savingsScale = 7 / 365;
        break;
      case '30D':
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        multiplier = 90;
        noiseFactor = 0.05;
        savingsScale = 30 / 365;
        break;
      default:
        labels = ['Point'];
        savingsScale = 1 / 365;
    }

    return { labels, multiplier, noiseFactor, savingsScale };
  }, [dateRange]);

  const productionHistory = useMemo(() => {
    const targetBase = 120 * (reportContext.multiplier / reportContext.labels.length);
    const data = reportContext.labels.map((label, idx) => {
      const randomness = (1 - reportContext.noiseFactor) + (Math.random() * reportContext.noiseFactor * 2);
      const target = Math.round(targetBase);
      let actual = Math.round(target * randomness);
      
      // If we are looking at the current Shift range, we want to ensure 
      // the total sum or last point aligns roughly with real production stats.
      // For this prototype, we'll override the last few points if in "Shift" mode
      if (dateRange === 'Shift' && idx === reportContext.labels.length - 1) {
         // This is a simplification to map the aggregate numbers to the chart
         actual = Math.max(0, productionStats.actual - (target * (idx))); 
         if (actual > target * 1.5) actual = target; // Cap it for visual sanity
      }

      return { label, actual, target };
    });
    return data;
  }, [reportContext, dateRange, productionStats]);

  const strategicValue = useMemo(() => {
    const scale = reportContext.savingsScale;
    const laborCases = [
      { name: "Avoided Shutdowns", value: 1200000 * scale, icon: Siren },
      { name: "Direct Labor Savings", value: 450000 * scale, icon: Users }
    ];
    const materialCases = [
      { name: "Safety Stock Optimization", value: 820000 * scale, icon: Package },
      { name: "Freight Cost Reduction", value: 310000 * scale, icon: Truck }
    ];
    const machineCases = [
      { name: "Component Life Extension", value: 1500000 * scale, icon: Cpu },
      { name: "Avoided Loss of Output", value: 2200000 * scale, icon: Activity }
    ];

    const laborTotal = laborCases.reduce((acc, c) => acc + c.value, 0);
    const materialTotal = materialCases.reduce((acc, c) => acc + c.value, 0);
    const machineTotal = machineCases.reduce((acc, c) => acc + c.value, 0);

    return {
      totalRangeSavings: laborTotal + materialTotal + machineTotal,
      labor: { title: "Manpower Rebalancing", total: laborTotal, cases: laborCases },
      material: { title: "Inventory Intelligence", total: materialTotal, cases: materialCases },
      machine: { title: "Predictive Strategy", total: machineTotal, cases: machineCases }
    };
  }, [reportContext.savingsScale]);

  const topKpis = useMemo(() => {
    const currentOee = MOCK_MACHINES.reduce((acc, m) => acc + m.oee, 0) / MOCK_MACHINES.length;
    const currentInv = CSV_DATA.reduce((acc, p) => acc + p.InventoryValueINR, 0) / 100000;
    const currentUtil = (laborPool.filter(w => w.status === 'Present').length / laborPool.length) * 100;
    const currentDowntime = MOCK_MACHINES.filter(m => m.status !== 'operational').length * 45;

    return [
      { label: 'Avg Plant OEE', value: `${currentOee.toFixed(1)}%`, trend: '+1.2%', icon: Activity, color: 'blue' },
      { label: 'Inventory Capital', value: `₹${currentInv.toFixed(1)}L`, trend: '-2.4%', icon: Package, color: 'emerald' },
      { label: 'Worker Efficiency', value: `${currentUtil.toFixed(0)}%`, trend: '+0.5%', icon: Users, color: 'indigo' },
      { label: 'Realized Downtime', value: dateRange === 'Shift' ? `${currentDowntime}m` : `${(currentDowntime * reportContext.multiplier / 10).toFixed(0)}m`, trend: '-12%', icon: Clock, color: 'rose' },
    ];
  }, [laborPool, dateRange, reportContext.multiplier]);

  const manpowerStats = useMemo(() => {
    const statusCounts = laborPool.reduce((acc, w) => {
      acc[w.status] = (acc[w.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return [
      { name: 'Direct Production', value: statusCounts['Present'] || 0 },
      { name: 'TPM / 5S', value: (statusCounts['TPM'] || 0) + (statusCounts['5S'] || 0) },
      { name: 'Training', value: statusCounts['Training'] || 0 },
      { name: 'Support', value: statusCounts['Maintenance'] || 0 },
      { name: 'Absence', value: (statusCounts['Absent'] || 0) + (statusCounts['On Leave'] || 0) },
    ];
  }, [laborPool]);

  const materialHealthData = useMemo(() => {
    const models = [...new Set(CSV_DATA.map(m => m.Model))];
    return models.map(model => {
      const parts = CSV_DATA.filter(p => p.Model === model);
      const totalValue = parts.reduce((acc, p) => acc + p.InventoryValueINR, 0);
      const riskParts = parts.filter(p => p.OnHandQty < p.SafetyStock).length;
      return {
        model,
        value: Math.round(totalValue / 1000), 
        riskCount: riskParts,
        health: Math.max(0, 100 - (riskParts / parts.length) * 100)
      };
    });
  }, []);

  const formatInr = (val: number) => {
    if (val >= 1000000) return `₹${(val / 1000000).toFixed(2)}M`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val.toFixed(0)}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Strategic Plant Analytics</h2>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <History size={14} className="text-blue-500" /> Executive Overview • Real-time Data: {dateRange}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {(['Shift', '24H', '7D', '30D'] as const).map(range => (
            <button 
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${
                dateRange === range ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <Award size={300} />
        </div>
        
        <div className="relative z-10">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 border-b border-white/10 pb-10">
              <div className="w-full text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <span className="px-3 py-1 bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest">Performance Summary</span>
                </div>
                <h3 className="text-5xl font-black tracking-tight leading-tight">
                  <span className="text-blue-400">{formatInr(strategicValue.totalRangeSavings)}</span> Savings Realized <br className="hidden md:block"/>In {dateRange} Window
                </h3>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {['labor', 'material', 'machine'].map((key) => {
                 const data = (strategicValue as any)[key];
                 return (
                  <div key={key} className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                     <div className="flex items-center justify-between mb-8">
                        <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-lg ${key === 'labor' ? 'bg-indigo-600' : key === 'material' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                          {key === 'labor' ? <Users size={28} /> : key === 'material' ? <Package size={28} /> : <Cpu size={28} />}
                        </div>
                        <div className="text-right">
                           <p className="text-3xl font-black text-white">{formatInr(data.total)}</p>
                           <p className="text-[10px] font-black text-slate-500 uppercase">Impact Realized</p>
                        </div>
                     </div>
                     <h4 className="text-xl font-bold mb-3">{data.title}</h4>
                     <div className="space-y-4">
                        {data.cases.map((c: any) => (
                          <div key={c.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                               <c.icon size={16} className="text-blue-400" />
                               <span className="text-xs font-bold text-slate-300">{c.name}</span>
                            </div>
                            <span className="text-sm font-black text-white">{formatInr(c.value)}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                 );
              })}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topKpis.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
               <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon size={22} />
               </div>
               <div className={`text-[10px] font-black px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                 {stat.trend}
               </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">Output History ({dateRange})</h3>
            <div className="flex gap-4 text-[10px] font-black text-slate-500 uppercase">
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Actual</div>
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" />Target</div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={productionHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip isAnimationActive={false} cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="actual" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} isAnimationActive={false} />
                <Line type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-8">Workforce Deployment ({dateRange})</h3>
          <div className="h-64 w-full relative mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={manpowerStats} innerRadius={70} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none" isAnimationActive={false}>
                  {manpowerStats.map((_entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                </Pie>
                <Tooltip isAnimationActive={false} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{laborPool.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pool Total</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {manpowerStats.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ReportsDashboard);
