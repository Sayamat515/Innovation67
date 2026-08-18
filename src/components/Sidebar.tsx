// src/components/Sidebar.tsx
import { useMemo, useState } from 'react';
import { Plus, Crosshair, AlertTriangle, Zap, Activity, ShieldAlert, ArrowUpRight } from 'lucide-react';
import type { JsaData } from '../types/jsa';

interface SidebarProps {
  jobs: JsaData[];
  isAddingMode: boolean;
  onToggleAddMode: () => void;
}

export default function Sidebar({ jobs, isAddingMode, onToggleAddMode }: SidebarProps) {
  const [hoveredChartSeg, setHoveredChartSeg] = useState<string | null>(null);

  const analytics = useMemo(() => {
    return {
      critical: jobs.filter(j => j.riskLevel === 'CRITICAL').length,
      high: jobs.filter(j => j.riskLevel === 'HIGH').length,
      medium: jobs.filter(j => j.riskLevel === 'MEDIUM').length,
      low: jobs.filter(j => j.riskLevel === 'LOW').length,
      simopsCount: jobs.filter(j => j.simops).length,
      total: jobs.length
    };
  }, [jobs]);

  const getRiskColor = (level: string) => {
    switch (level) { 
      case 'CRITICAL': return '#ef4444'; // Red-500
      case 'HIGH': return '#f97316';     // Orange-500
      case 'MEDIUM': return '#eab308';   // Yellow-500
      case 'LOW': return '#10b981';      // Emerald-500
      default: return '#e2e8f0'; 
    }
  };

  // กราฟวงกลมแบบหนา (Thick Donut) ตามเรฟเฟอเรนซ์
  const radius = 40; // ลดขนาดลงนิดหน่อยให้ดูพอดีการ์ด
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;
  
  const chartSegments = [
    { id: 'LOW', color: getRiskColor('LOW'), count: analytics.low },
    { id: 'MEDIUM', color: getRiskColor('MEDIUM'), count: analytics.medium },
    { id: 'HIGH', color: getRiskColor('HIGH'), count: analytics.high },
    { id: 'CRITICAL', color: getRiskColor('CRITICAL'), count: analytics.critical },
  ].filter(seg => seg.count > 0).map(seg => {
    const percentage = analytics.total > 0 ? seg.count / analytics.total : 0;
    const strokeLength = percentage * circumference;
    currentOffset += strokeLength;
    return { ...seg, strokeDasharray: `${strokeLength} ${circumference}`, strokeDashoffset: -(currentOffset - strokeLength), percentage };
  });

  return (
    <aside className="absolute inset-y-0 left-0 z-30 w-[340px] bg-[#f8fafc] flex flex-col shadow-2xl md:shadow-none md:relative transition-transform duration-300 border-r border-slate-200">
      
      {/* 🟢 1. Header & Primary Action (สไตล์โค้งมน) */}
      <div className="p-5 pb-2">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Overview</h2>
            <p className="text-xs font-medium text-slate-500">อาคาร 1 ชั้น (10,000 ตร.ม.)</p>
          </div>
          
          <button 
            onClick={onToggleAddMode}
            className={`w-full flex justify-center items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 shadow-sm active:scale-95 ${
              isAddingMode 
                ? 'bg-amber-500 text-white shadow-amber-500/40 animate-pulse' 
                : 'bg-[#0f172a] text-white hover:bg-slate-800 hover:shadow-md'
            }`}
          >
            {isAddingMode ? <Crosshair className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isAddingMode ? 'คลิกบนแผนที่เพื่อระบุตำแหน่ง' : 'New JSA Record'}
          </button>
        </div>
      </div>

      {/* 🟢 2. Scrollable Content Area */}
      <div className="p-5 pt-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* KPI Mini Cards (Bento Style) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total JSA</span>
              <div className="bg-slate-100 p-1 rounded-full"><ArrowUpRight className="w-3 h-3 text-slate-500"/></div>
            </div>
            <div className="text-3xl font-black text-slate-800">{analytics.total}</div>
          </div>
          
          <div className="bg-[#fff1f2] p-4 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Critical</span>
              <div className="bg-rose-100 p-1 rounded-full"><ShieldAlert className="w-3 h-3 text-rose-500"/></div>
            </div>
            <div className="text-3xl font-black text-rose-700">{analytics.critical}</div>
          </div>
        </div>

        {/* 🟢 3. Risk Analytics Chart (Bento Card) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-500" /> Risk Matrix Analytics
          </h3>
          
          <div className="flex items-center justify-between">
            {/* กราฟ */}
            <div className="relative flex justify-center items-center h-28 w-28">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                {chartSegments.map(seg => (
                  <circle 
                    key={seg.id} cx="50" cy="50" r={radius} fill="transparent" 
                    stroke={seg.color} strokeWidth={hoveredChartSeg === seg.id ? "16" : "12"} 
                    strokeDasharray={seg.strokeDasharray} strokeDashoffset={seg.strokeDashoffset} 
                    strokeLinecap="round" // ทำให้ขอบกราฟมนๆ แบบใน Reference
                    className="transition-all duration-300 ease-out cursor-pointer" 
                    onMouseEnter={() => setHoveredChartSeg(seg.id)} onMouseLeave={() => setHoveredChartSeg(null)}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800 transition-colors" style={{ color: hoveredChartSeg ? getRiskColor(hoveredChartSeg) : '#1e293b'}}>
                  {hoveredChartSeg === 'CRITICAL' ? analytics.critical : hoveredChartSeg === 'HIGH' ? analytics.high : hoveredChartSeg === 'MEDIUM' ? analytics.medium : hoveredChartSeg === 'LOW' ? analytics.low : analytics.total}
                </span>
              </div>
            </div>

            {/* Legend แบบคลีนๆ */}
            <div className="space-y-2 flex-1 ml-6">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => {
                const count = analytics[level.toLowerCase() as keyof typeof analytics];
                if (count === 0 && level !== 'CRITICAL') return null; // ซ่อนอันที่เป็น 0 ยกเว้น Critical
                return (
                  <div key={level} className="flex items-center justify-between text-xs font-bold" onMouseEnter={() => setHoveredChartSeg(level)} onMouseLeave={() => setHoveredChartSeg(null)}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getRiskColor(level) }}></span>
                      <span className="text-slate-500">{level}</span>
                    </div>
                    <span className="text-slate-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 🟢 4. SIMOPS Alert Box (ทำเป็น Card สไตล์โดดเด่น) */}
        {analytics.simopsCount > 0 && (
          <div className="bg-[#fffbeb] p-5 rounded-2xl border-2 border-amber-300 shadow-sm relative overflow-hidden transition-all">
            <div className="absolute -top-4 -right-4 p-2 opacity-20">
              <Zap className="w-24 h-24 text-amber-500"/>
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-black text-amber-900 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" /> SIMOPS Conflict
              </h3>
              <p className="text-xs text-amber-700 font-medium mb-4 leading-relaxed">
                พบการทับซ้อนเชิงพื้นที่ {analytics.simopsCount} รายการ จำเป็นต้องเข้าจัดการ(Mitigate) ทันที
              </p>
              {/* ปุ่มสไตล์ใน Reference ภาพ */}
              <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors w-full">
                Review Conflicts
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}