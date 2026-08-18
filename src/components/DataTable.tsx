// src/components/DataTable.tsx
import { useState } from 'react';
import { Search, Zap, Map as MapIcon, Shield, Filter } from 'lucide-react';
import type { JsaData } from '../types/jsa';

interface DataTableProps {
  jobs: JsaData[];
  onFocusJob: (lat: number, lng: number) => void;
}

export default function DataTable({ jobs, onFocusJob }: DataTableProps) {
  const [activeRisk, setActiveRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = jobs.filter(job => {
    const matchRisk = activeRisk === 'ALL' ? true : activeRisk === 'SIMOPS' ? job.simops : job.riskLevel === activeRisk;
    const matchSearch = job.jsaNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        job.jobStep.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRisk && matchSearch;
  });

  const getRiskColor = (level: string) => {
    switch (level) { 
      case 'CRITICAL': return '#ef4444'; 
      case 'HIGH': return '#f97316'; 
      case 'MEDIUM': return '#eab308'; 
      case 'LOW': return '#10b981'; 
      default: return '#94a3b8'; 
    }
  };

  return (
    // เปลี่ยนพื้นหลังเป็นสีเทาอ่อน เพื่อให้ Card สีขาวลอยเด่นขึ้นมา
    <div className="flex flex-col h-full bg-[#f8fafc] p-4">
      
      {/* 📦 Bento Card Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        
        {/* ส่วนหัวตาราง: ปุ่ม Filter และ ช่องค้นหา */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-50 shrink-0">
          
          {/* แถบปุ่มกรองความเสี่ยง (สไตล์ Pill โค้งมน) */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 sm:pb-0 items-center">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1"><Filter className="w-3.5 h-3.5"/> Filter:</span>
            <button onClick={() => setActiveRisk('ALL')} className={`shrink-0 px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${activeRisk === 'ALL' ? 'bg-[#0f172a] text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>All</button>
            <button onClick={() => setActiveRisk('CRITICAL')} className={`shrink-0 px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${activeRisk === 'CRITICAL' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600'}`}>Critical</button>
            <button onClick={() => setActiveRisk('HIGH')} className={`shrink-0 px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${activeRisk === 'HIGH' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-500'}`}>High</button>
            <button onClick={() => setActiveRisk('SIMOPS')} className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${activeRisk === 'SIMOPS' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'}`}>
              <Zap className="w-3.5 h-3.5"/> SIMOPS
            </button>
          </div>

          {/* ช่องค้นหา (สไตล์ในภาพ Reference พื้นเทา ขอบมน) */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 text-xs border-none rounded-full outline-none focus:ring-2 focus:ring-slate-200 transition-all bg-slate-100 text-slate-700 font-medium placeholder-slate-400"
            />
          </div>
        </div>

        {/* พื้นที่ตารางข้อมูล */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px]">
            <thead className="sticky top-0 bg-white/90 backdrop-blur-sm text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 z-10">
              <tr>
                <th className="px-5 py-4">JSA No.</th>
                <th className="px-5 py-4">Job Details</th>
                <th className="px-5 py-4 text-center">Risk Level</th>
                <th className="px-5 py-4">Hazards Alert</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredJobs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold">No tasks found</td></tr>
              ) : filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-3.5 font-black text-slate-800">{job.jsaNo}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-slate-700 font-medium mb-0.5">{job.jobStep}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{job.area}</div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-sm w-24" style={{ backgroundColor: getRiskColor(job.riskLevel) }}>
                      {job.riskLevel}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-slate-600 font-medium text-[11px] mb-1 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-slate-400"/> <span className="truncate max-w-[200px]">{job.potentialHazard}</span>
                    </div>
                    {job.simops && (
                      <div className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] inline-flex items-center gap-1 font-bold">
                        <Zap className="w-3 h-3"/> {job.simopsDetail}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button 
                      onClick={() => onFocusJob(job.lat, job.lng)} 
                      className="bg-white border border-slate-200 text-slate-600 hover:border-slate-800 hover:bg-slate-800 hover:text-white px-4 py-1.5 rounded-full font-bold text-[10px] uppercase shadow-sm transition-all active:scale-95 flex items-center gap-1.5 mx-auto opacity-0 group-hover:opacity-100"
                    >
                      <MapIcon className="w-3 h-3" /> Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}