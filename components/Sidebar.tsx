
import React, { memo } from 'react';
import { DashboardTab, PlantConfig } from '../types';
import { LayoutDashboard, Package, Users, Activity, Sliders, Briefcase, Cpu, Settings, FileBarChart } from 'lucide-react';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  config?: PlantConfig;
  shiftProgress?: number;
}

const Sidebar: React.FC<SidebarProps> = memo(({ activeTab, setActiveTab, config, shiftProgress = 0 }) => {
  const menuItems = [
    { id: DashboardTab.MANAGEMENT, label: 'Management', icon: LayoutDashboard },
    { id: DashboardTab.OPERATIONS, label: 'Operations', icon: Activity },
    { id: DashboardTab.EXECUTION, label: 'Execution', icon: Briefcase },
    { id: DashboardTab.PLANNING, label: 'Planning & Replan', icon: Sliders },
    { id: DashboardTab.MATERIAL, label: 'Material', icon: Package },
    { id: DashboardTab.LABOR, label: 'Labor & Skills', icon: Users },
    { id: DashboardTab.MACHINE, label: 'Machine', icon: Cpu },
    { id: DashboardTab.ADMIN, label: 'Admin Panel', icon: Settings },
    { id: DashboardTab.REPORTS, label: 'Analytics Reports', icon: FileBarChart },
  ];

  const companyName = config?.companyName || 'TATA MOTORS';
  const logoUrl = config?.logoUrl;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 h-full flex flex-col shrink-0 transition-all">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-white font-bold text-lg">{companyName.charAt(0)}</span>
            )}
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-none uppercase truncate">{companyName}</h1>
        </div>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50 scale-[1.02]' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shift Progress</span>
          <span className="text-xs font-bold text-blue-400">{Math.round(shiftProgress)}%</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${shiftProgress}%` }} />
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
