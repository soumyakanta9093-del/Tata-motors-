
import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { DashboardTab, PlantConfig, Worker, ProductionLine, Language } from './types';
import { getMasterLaborPool } from './constants';
import { useI18n } from './services/i18nService';
import Sidebar from './components/Sidebar';
import DashboardManagement from './components/DashboardManagement';
import DashboardMaterials from './components/DashboardMaterials';
import PlanningCenter from './components/PlanningCenter';
import LaborDashboard from './components/LaborDashboard';
import DashboardMachine from './components/DashboardMachine';
import AdminDashboard from './components/AdminDashboard'; 
import ReportsDashboard from './components/ReportsDashboard';
import { Bell, User, Activity, Clock, RefreshCw, Languages } from 'lucide-react';

const TabContent = memo(({ 
  activeTab, 
  plantConfig, 
  updateConfig, 
  activeLines, 
  laborPool, 
  setLaborPool, 
  currentShift,
  productionStats,
  lang
}: {
  activeTab: DashboardTab;
  plantConfig: PlantConfig;
  updateConfig: (cfg: Partial<PlantConfig>) => void;
  activeLines: ProductionLine[];
  laborPool: Worker[];
  setLaborPool: React.Dispatch<React.SetStateAction<Worker[]>>;
  currentShift: 'A' | 'B' | 'C';
  productionStats: { planned: number; actual: number; percent: number };
  lang: Language;
}) => {
  const t = useI18n(lang);

  switch (activeTab) {
    case DashboardTab.MANAGEMENT: return <DashboardManagement lang={lang} />;
    case DashboardTab.MATERIALS: return <DashboardMaterials lang={lang} />;
    case DashboardTab.PLANNING: return <PlanningCenter lang={lang} />;
    case DashboardTab.LABOR: return (
      <LaborDashboard 
        initialLines={activeLines} 
        currentShift={currentShift}
        config={plantConfig}
        productionStats={productionStats}
        lang={lang}
      />
    );
    case DashboardTab.MACHINE: return <DashboardMachine lang={lang} />;
    case DashboardTab.ADMIN: return (
      <AdminDashboard 
        config={plantConfig} 
        onUpdate={updateConfig} 
        laborPool={laborPool}
        setLaborPool={setLaborPool}
        lang={lang}
      />
    );
    case DashboardTab.REPORTS: return (
      <ReportsDashboard 
        laborPool={laborPool} 
        activeLines={activeLines} 
        productionStats={productionStats}
        lang={lang}
      />
    );
    default:
      return (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <Activity className="text-slate-300 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-900">{t(activeTab.toUpperCase())} Module</h2>
          <p className="text-slate-500 text-sm mt-1">System is being optimized for this view.</p>
        </div>
      );
  }
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.MANAGEMENT);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoShiftEnabled, setAutoShiftEnabled] = useState(true);
  const [lang, setLang] = useState<Language>('EN');
  
  const [laborPool, setLaborPool] = useState<Worker[]>(() => getMasterLaborPool());
  const [currentShift, setCurrentShift] = useState<'A' | 'B' | 'C'>('A');

  const t = useI18n(lang);

  const [plantConfig, setPlantConfig] = useState<PlantConfig>({
    companyName: 'TATA MOTORS',
    logoUrl: '', 
    primaryColor: '#2563eb',
    shiftTimings: {
      morning: '06:00 - 14:00',
      evening: '14:00 - 22:00',
      night: '22:00 - 06:00'
    }
  });

  const updateConfig = useCallback((newConfig: Partial<PlantConfig>) => {
    setPlantConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (autoShiftEnabled) {
        const hour = now.getHours();
        const totalMinutes = hour * 60 + now.getMinutes();
        let detected: 'A' | 'B' | 'C' = 'A';
        if (totalMinutes >= 360 && totalMinutes < 840) detected = 'A';
        else if (totalMinutes >= 840 && totalMinutes < 1320) detected = 'B';
        else detected = 'C';
        if (detected !== currentShift) setCurrentShift(detected);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [autoShiftEnabled, currentShift]);

  const shiftProgress = useMemo(() => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const currentTotalMinutes = hour * 60 + minutes;

    let start = 0;
    const totalDuration = 8 * 60; // 8 hour shifts

    if (currentShift === 'A') {
      start = 6 * 60;
    } else if (currentShift === 'B') {
      start = 14 * 60;
    } else {
      start = 22 * 60;
      let adjustedNow = currentTotalMinutes;
      if (currentTotalMinutes < 360) adjustedNow += 24 * 60; 
      const elapsed = adjustedNow - start;
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }

    const elapsed = currentTotalMinutes - start;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [currentTime, currentShift]);

  const productionStats = useMemo(() => {
    const planned = 240; 
    const efficiency = 0.96; 
    const actual = Math.floor(planned * (shiftProgress / 100) * efficiency);
    const percent = shiftProgress > 0 ? Math.round((actual / (planned * (shiftProgress / 100))) * 100) : 0;
    
    return {
      planned,
      actual,
      percent: isNaN(percent) ? 0 : Math.min(100, percent)
    };
  }, [shiftProgress]);

  const activeLines = useMemo(() => {
    const shiftWorkers = laborPool.filter(w => w.shift === currentShift);
    const lineNames = ["Trim Line", "Chassis Line", "Door Assembly", "Seat Fitment", "Marriage Line", "Final Assembly"];
    return Array.from({ length: 6 }, (_, i) => {
      const lineId = `L${i + 1}`;
      const lw = shiftWorkers.filter(w => w.assignedLine === lineId);
      return {
        id: lineId,
        name: lineNames[i],
        taktTime: 90,
        requiredManpower: 4,
        currentWorkers: lw.filter(w => w.type === 'Main'),
        buffers: lw.filter(w => w.type === 'Buffer')
      } as ProductionLine;
    });
  }, [laborPool, currentShift]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-8 text-center bg-slate-900 text-white">
            <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">{plantConfig.companyName.charAt(0)}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">{plantConfig.companyName}</h1>
          </div>
          <div className="p-8 space-y-6">
            <button onClick={() => setIsLoggedIn(true)} className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold shadow-lg transition-all active:scale-[0.98]">{t('sign_in')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        config={plantConfig} 
        shiftProgress={shiftProgress}
        lang={lang}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-10">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 leading-none">{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
               <button onClick={() => setAutoShiftEnabled(!autoShiftEnabled)} className={`p-1.5 rounded ${autoShiftEnabled ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                 <RefreshCw size={12} />
               </button>
               {(['A', 'B', 'C'] as const).map(s => (
                 <button key={s} disabled={autoShiftEnabled} onClick={() => setCurrentShift(s)} className={`px-3 py-1 text-[10px] font-black rounded ${currentShift === s ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{s}</button>
               ))}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setLang('EN')} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${lang === 'EN' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('DE')} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${lang === 'DE' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                DE
              </button>
            </div>
            <Bell size={20} className="text-slate-400" />
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><User size={20} /></div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <TabContent 
              activeTab={activeTab} 
              plantConfig={plantConfig} 
              updateConfig={updateConfig} 
              activeLines={activeLines} 
              laborPool={laborPool} 
              setLaborPool={setLaborPool}
              currentShift={currentShift} 
              productionStats={productionStats}
              lang={lang}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
