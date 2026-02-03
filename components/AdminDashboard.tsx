
import React, { useState, memo, useCallback, useMemo, useRef } from 'react';
import { PlantConfig, AppUser, Worker, SkillSet } from '../types';
import { 
  Users, Settings, Package, Truck, Clock, 
  Palette, ShieldCheck, UserPlus, Plus, 
  Trash2, Edit3, Image as ImageIcon, Save,
  CheckCircle, Factory, ClipboardList, Car, 
  HardDrive, UserCheck, Briefcase, X,
  FileUp, CloudDownload, RefreshCw, Loader2,
  Database, Info
} from 'lucide-react';

interface AdminDashboardProps {
  config: PlantConfig;
  onUpdate: (newConfig: Partial<PlantConfig>) => void;
  laborPool: Worker[];
  setLaborPool: React.Dispatch<React.SetStateAction<Worker[]>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ config, onUpdate, laborPool, setLaborPool }) => {
  const [activeTab, setActiveTab] = useState<'master' | 'system'>('master');
  const [masterSubTab, setMasterSubTab] = useState<'cars' | 'bom' | 'staff' | 'labor'>('cars');
  
  // Local Master Data (Cars/BOM/Staff) - Labor is now passed from App
  const [cars, setCars] = useState(['Curvv EV', 'Safari Red Dark', 'Nexon.ev LR', 'Altroz Racer']);
  const [bomModules, setBomModules] = useState([
    { id: 'B1', name: 'e-Powertrain Bundle', parts: ['BMS Controller', 'DC-DC Converter', 'Harness Set'] }
  ]);
  const [staff, setStaff] = useState<AppUser[]>([
    { id: '1', name: 'Arjun Singh', role: 'Admin', email: 'arjun.s@plant.com' },
    { id: '2', name: 'Priya Sharma', role: 'Manager', email: 'priya.sh@plant.com' }
  ]);

  const [showModal, setShowModal] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSyncingERP, setIsSyncingERP] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveConfig = () => {
    setSaveStatus('Saving Master Data...');
    setTimeout(() => {
      setSaveStatus('Sync Successful!');
      setTimeout(() => setSaveStatus(null), 2000);
    }, 800);
  };

  const handleErpSync = () => {
    setIsSyncingERP(true);
    setTimeout(() => {
      setIsSyncingERP(false);
      setSaveStatus('ERP Data Fetched (SAP S/4HANA)');
      setTimeout(() => setSaveStatus(null), 3000);
    }, 2500);
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setSaveStatus(`Imported entries from ${e.target.files![0].name}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setSaveStatus(null), 3000);
    }, 1800);
  };

  const addItem = (type: string, data: any) => {
    switch(type) {
      case 'car': setCars([...cars, data]); break;
      case 'bom': setBomModules([...bomModules, { id: `B${bomModules.length + 1}`, ...data }]); break;
      case 'staff': setStaff([...staff, { id: Date.now().toString(), ...data }]); break;
      case 'labor': 
        setLaborPool([...laborPool, { 
          id: `TM-EXT-${Date.now().toString().slice(-4)}`, 
          skills: ['Assembly'],
          status: 'Present',
          type: 'Main',
          ...data 
        }]); 
        break;
    }
    setShowModal(null);
  };

  const Modal = ({ title, type, fields }: { title: string, type: string, fields: { name: string, label: string, type: string, options?: string[] }[] }) => {
    const [formData, setFormData] = useState<any>({});
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
            <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            {fields.map(f => (
              <div key={f.name}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{f.label}</label>
                {f.type === 'select' ? (
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                    onChange={(e) => setFormData({...formData, [f.name]: e.target.value})}
                  >
                    <option value="">Select Option</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input 
                    type={f.type} 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    onChange={(e) => setFormData({...formData, [f.name]: e.target.value})}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="p-6 bg-slate-50 rounded-b-2xl flex gap-3">
            <button onClick={() => setShowModal(null)} className="flex-1 py-2 font-bold text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
            <button 
              onClick={() => addItem(type, type === 'car' ? formData.name : formData)}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 text-sm"
            >
              Add Entry
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMasterData = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit">
          {[
            { id: 'cars', label: 'Car Master', icon: Car },
            { id: 'bom', label: 'BOM Master', icon: HardDrive },
            { id: 'staff', label: 'Staff Master', icon: UserCheck },
            { id: 'labor', label: 'Labor Pool', icon: Briefcase }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setMasterSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                masterSubTab === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
           <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleExcelImport} />
           <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
             {isImporting ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
             <span>EXCEL IMPORT</span>
           </button>
           <button onClick={handleErpSync} disabled={isSyncingERP} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-all disabled:opacity-50">
             {isSyncingERP ? <RefreshCw size={14} className="animate-spin" /> : <CloudDownload size={14} />}
             <span>ERP SYNC</span>
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <Database size={14} className="text-slate-400" />
              {masterSubTab.toUpperCase()} REPOSITORY
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Manage global system entries for {masterSubTab}</p>
          </div>
          <button 
            onClick={() => setShowModal(masterSubTab)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-900/20"
          >
            <Plus size={14} /> ADD NEW
          </button>
        </div>

        <div className="p-6">
          {masterSubTab === 'cars' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map(car => (
                <div key={car} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Car size={16} /></div>
                    <span className="text-sm font-bold text-slate-700">{car}</span>
                  </div>
                  <button className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {masterSubTab === 'bom' && (
            <div className="space-y-4">
              {bomModules.map(mod => (
                <div key={mod.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">{mod.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Info size={10} /> ID: {mod.id}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mod.parts.map(p => (
                      <span key={p} className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-600 shadow-sm">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {masterSubTab === 'staff' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 font-bold uppercase border-b">
                  <tr><th className="px-4 py-4">Name</th><th className="px-4 py-4">Role</th><th className="px-4 py-4">Email</th><th className="px-4 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-bold text-slate-900">{s.name}</td>
                      <td className="px-4 py-4 font-bold text-blue-600 uppercase">{s.role}</td>
                      <td className="px-4 py-4 text-slate-500">{s.email}</td>
                      <td className="px-4 py-4 text-right"><button className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {masterSubTab === 'labor' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 font-black uppercase tracking-tighter border-b bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-4">Employee ID</th>
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Line Assignment</th>
                    <th className="px-4 py-4">Shift</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {laborPool.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-mono font-bold text-blue-600">{l.id}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{l.name}</td>
                      <td className="px-4 py-4 text-slate-500">{l.assignedLine}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          l.shift === 'A' ? 'bg-blue-50 text-blue-600' :
                          l.shift === 'B' ? 'bg-purple-50 text-purple-600' :
                          'bg-slate-900 text-white'
                        }`}>
                          Shift {l.shift}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={() => setLaborPool(prev => prev.filter(x => x.id !== l.id))}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-8 animate-in fade-in">
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6 border-b pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Palette size={20} /></div>
          <div>
            <h3 className="font-bold text-slate-900">Whitelabel Branding (WT)</h3>
            <p className="text-xs text-slate-500">Customize the application identity</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Company Name</label>
              <input type="text" value={config.companyName} onChange={(e) => onUpdate({ companyName: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Logo URL</label>
              <input type="text" value={config.logoUrl} placeholder="https://..." onChange={(e) => onUpdate({ logoUrl: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded flex items-center justify-center shadow-sm border border-slate-200 overflow-hidden">
                {config.logoUrl ? <img src={config.logoUrl} alt="Preview" className="w-full h-full object-contain p-1" /> : <span className="text-xl font-bold text-blue-600">{config.companyName.charAt(0)}</span>}
             </div>
             <div><p className="text-xs font-bold text-slate-700">Preview UI</p><p className="text-[10px] text-slate-400">Branding sync across modules</p></div>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6 border-b pb-4">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={20} /></div>
          <div><h3 className="font-bold text-slate-900">Shift Configurations</h3><p className="text-xs text-slate-500">Define operational hours</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(config.shiftTimings).map(([key, value]) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{key} Shift</label>
              <input type="text" value={value} onChange={(e) => onUpdate({ shiftTimings: { ...config.shiftTimings, [key]: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">{saveStatus && <><CheckCircle size={16} /> {saveStatus}</>}</div>
        <button onClick={handleSaveConfig} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
          <Save size={18} /> SAVE MASTER CONFIG
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Administration</h2>
          <p className="text-slate-500 text-sm font-medium">Configure global repositories and shift roster assignments</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button onClick={() => setActiveTab('master')} className={`px-6 py-2 text-xs font-bold rounded flex items-center gap-2 transition-all ${activeTab === 'master' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Package size={14} /> MASTER DATA</button>
          <button onClick={() => setActiveTab('system')} className={`px-6 py-2 text-xs font-bold rounded flex items-center gap-2 transition-all ${activeTab === 'system' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Settings size={14} /> SYSTEM</button>
        </div>
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'master' ? renderMasterData() : renderSystemSettings()}
      </div>

      {showModal === 'cars' && <Modal title="Add Car Variant" type="car" fields={[{ name: 'name', label: 'Variant Name', type: 'text' }]} />}
      {showModal === 'staff' && <Modal title="Add Staff User" type="staff" fields={[{ name: 'name', label: 'Full Name', type: 'text' }, { name: 'role', label: 'Role', type: 'text' }, { name: 'email', label: 'Email Address', type: 'email' }]} />}
      {showModal === 'labor' && <Modal title="Register Laborer" type="labor" fields={[
        { name: 'name', label: 'Employee Name', type: 'text' },
        { name: 'assignedLine', label: 'Line Assignment (e.g., L1, L2)', type: 'text' },
        { name: 'shift', label: 'Shift Assignment', type: 'select', options: ['A', 'B', 'C'] }
      ]} />}
      {showModal === 'bom' && <Modal title="New BOM Module" type="bom" fields={[{ name: 'name', label: 'Module Name', type: 'text' }, { name: 'parts', label: 'Parts (Comma Separated)', type: 'text' }]} />}
      
      <div className="pt-8 border-t border-slate-200 opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-mono text-slate-400 text-center uppercase tracking-[0.2em]">FEATURE_TAG: WT (Centralized Labor Sync v2.2)</p>
      </div>
    </div>
  );
};

export default memo(AdminDashboard);
