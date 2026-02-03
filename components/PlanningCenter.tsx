
import React, { useState } from 'react';
import { getReplanningSuggestion } from '../services/planningService';
import { OptimizationObjective } from '../types';
import { 
  BrainCircuit, Play, CheckCircle2, RefreshCcw, 
  Loader2, Sparkles, TrendingUp, Target, 
  Zap, DollarSign, BarChart3 
} from 'lucide-react';

const PlanningCenter: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [constraint, setConstraint] = useState<'downtime' | 'labor' | 'material'>('downtime');
  const [objective, setObjective] = useState<OptimizationObjective>('profit');
  const [details, setDetails] = useState('Body Weld Robot A is down for 6 hours.');

  const handleReplan = async () => {
    setLoading(true);
    try {
      const suggestion = await getReplanningSuggestion(constraint, details, objective);
      setResult(suggestion);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg"><BrainCircuit size={24} /></div>
            <div><h2 className="text-xl font-bold text-slate-900">Dynamic Replanning</h2></div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            <Sparkles size={14} /> <span>MIP Engine Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <section>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Constraint</label>
              <div className="grid grid-cols-1 gap-2">
                {['downtime', 'material', 'labor'].map(type => (
                  <button key={type} onClick={() => setConstraint(type as any)} className={`px-4 py-3 rounded-lg text-left border transition-all flex items-center justify-between ${constraint === type ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600'}`}>
                    <span className="capitalize">{type}</span>
                    {constraint === type && <CheckCircle2 size={16} />}
                  </button>
                ))}
              </div>
            </section>
            <button onClick={handleReplan} disabled={loading} className="w-full flex items-center justify-center space-x-2 py-4 bg-slate-900 text-white rounded-lg font-bold">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
              <span>CALCULATE PRODUCT MIX</span>
            </button>
          </div>
          <div className="lg:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-200 min-h-[500px]">
            {result ? (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900">Optimized Schedule Proposal</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.suggestedMix?.map((mix: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <p className="text-sm font-bold text-slate-800">{mix.model}</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-2">{mix.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="h-full flex items-center justify-center text-slate-300">Awaiting Analysis</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningCenter;
