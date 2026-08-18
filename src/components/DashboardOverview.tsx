// src/components/DashboardOverview.tsx
import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Calendar, CheckCircle2, ShieldAlert, Zap, ArrowUpRight, ArrowDownRight, MoreHorizontal, Clock, ShieldCheck, X } from 'lucide-react';
import type { JsaData } from '../types/jsa';

interface DashboardOverviewProps {
  jobs: JsaData[];
  onMitigate: (id: string) => void; // 👈 เพิ่ม Prop นี้เพื่อส่งคำสั่งไปจัดการข้อมูลหลัก
}

export default function DashboardOverview({ jobs, onMitigate }: DashboardOverviewProps) {
  // State สำหรับเก็บ ID ของงานที่กำลังจะกด Mitigate
  const [mitigateTarget, setMitigateTarget] = useState<JsaData | null>(null);

  // คำนวณสถิติ
  const analytics = useMemo(() => {
    const critical = jobs.filter(j => j.riskLevel === 'CRITICAL').length;
    const simopsCount = jobs.filter(j => j.simops).length;
    
    // คำนวณคะแนน Safety Score
    let score = 100 - (critical * 15) - (simopsCount * 12);
    if (score < 0) score = 0;

    return {
      total: jobs.length,
      critical,
      high: jobs.filter(j => j.riskLevel === 'HIGH').length,
      medium: jobs.filter(j => j.riskLevel === 'MEDIUM').length,
      low: jobs.filter(j => j.riskLevel === 'LOW').length,
      simops: jobs.filter(j => j.simops),
      simopsCount,
      safetyScore: score
    };
  }, [jobs]);

  const weekData = [40, 70, 45, 90, 65, 30, 50]; 
  const gaugeCircumference = 125.6;
  const gaugeOffset = gaugeCircumference - (analytics.safetyScore / 100) * gaugeCircumference;

  const handleConfirmMitigate = () => {
    if (mitigateTarget) {
      onMitigate(mitigateTarget.id);
      setMitigateTarget(null); // ปิด Modal
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f7f9] p-6 md:p-8 custom-scrollbar relative">
      
      {/* 🔴 Mitigation Modal (จะแสดงเมื่อกดปุ่ม Mitigate Risk) */}
      {mitigateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <button onClick={() => setMitigateTarget(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">ยืนยันการจัดการความเสี่ยง?</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              คุณกำลังยืนยันว่าได้เข้าควบคุม <strong>{mitigateTarget.jobStep}</strong> ตามมาตรการ (Control Measures) เรียบร้อยแล้ว ระบบจะปรับลดความเสี่ยงเป็นระดับ <span className="font-bold text-emerald-500">LOW (Residual Risk)</span>
            </p>
            <div className="bg-slate-50 p-3 rounded-xl mb-6 border border-slate-100 text-xs text-slate-500">
              <span className="font-bold text-slate-700">JSA No:</span> {mitigateTarget.jsaNo}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMitigateTarget(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleConfirmMitigate} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex justify-center items-center gap-2">
                <CheckCircle2 className="w-4 h-4"/> ยืนยันดำเนินการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-1">Overview Dashboard</h2>
          <p className="text-sm font-medium text-slate-500">ติดตามและประเมินความเสี่ยง JSA ของโครงการอาคาร 1 ชั้น</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2 active:scale-95">
            <Calendar className="w-4 h-4"/> Filter Date
          </button>
          <button className="bg-[#0f3f2b] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-emerald-900 transition-colors active:scale-95">
            Export Report
          </button>
        </div>
      </div>

      {/* 🟢 1. Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Card 1: Total */}
        <div className="bg-gradient-to-br from-[#0f3f2b] to-[#062115] p-6 rounded-[28px] shadow-md relative overflow-hidden text-white flex flex-col justify-between h-[180px] hover:shadow-xl transition-shadow cursor-pointer">
          <div className="absolute -right-4 -top-4 p-4 opacity-10"><Activity className="w-32 h-32"/></div>
          <div className="relative z-10 flex justify-between items-start">
            <span className="text-sm font-bold text-emerald-50">Total Active JSA</span>
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm"><ArrowUpRight className="w-4 h-4 text-emerald-100"/></div>
          </div>
          <div className="relative z-10">
            <div className="text-6xl font-black tracking-tighter mb-2">{analytics.total}</div>
            <div className="text-[11px] font-bold text-emerald-900 bg-emerald-400 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3"/> Increased from last week
            </div>
          </div>
        </div>

        {/* Card 2: Critical */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[180px] cursor-pointer">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-slate-500">Critical Tasks</span>
            <div className="bg-rose-50 p-2 rounded-full"><ShieldAlert className="w-4 h-4 text-rose-500"/></div>
          </div>
          <div>
            <div className="text-6xl font-black text-slate-800 tracking-tighter mb-2">{analytics.critical}</div>
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <span className="text-rose-500 flex items-center"><ArrowUpRight className="w-3 h-3 mr-0.5"/> Action Required</span>
            </div>
          </div>
        </div>

        {/* Card 3: SIMOPS */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[180px] cursor-pointer">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-slate-500">SIMOPS Conflicts</span>
            <div className="bg-amber-50 p-2 rounded-full"><Zap className="w-4 h-4 text-amber-500"/></div>
          </div>
          <div>
            <div className="text-6xl font-black text-slate-800 tracking-tighter mb-2 transition-all">{analytics.simopsCount}</div>
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <span className="text-amber-500 flex items-center"><AlertTriangle className="w-3 h-3 mr-0.5"/> Spatial overlaps</span>
            </div>
          </div>
        </div>

        {/* Card 4: Safe */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[180px] cursor-pointer">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-slate-500">Low Risk Jobs</span>
            <div className="bg-emerald-50 p-2 rounded-full"><CheckCircle2 className="w-4 h-4 text-emerald-500"/></div>
          </div>
          <div>
            <div className="text-6xl font-black text-slate-800 tracking-tighter mb-2 transition-all">{analytics.low}</div>
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <span className="text-emerald-500 flex items-center"><ArrowDownRight className="w-3 h-3 mr-0.5"/> Well controlled</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 2. Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Risk Trend Bar Chart */}
        <div className="bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm lg:col-span-2 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800">Project Risk Analytics</h3>
              <p className="text-xs font-medium text-slate-500">แนวโน้มความเสี่ยงในไซต์งานรายสัปดาห์</p>
            </div>
            <button className="text-slate-400 hover:bg-slate-50 p-2 rounded-full transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
          </div>
          <div className="flex-1 flex items-end justify-between gap-3 px-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <div key={day} className="flex flex-col items-center gap-3 flex-1 group cursor-pointer">
                <div className="w-full max-w-[40px] bg-slate-100 rounded-full h-40 relative overflow-hidden flex items-end group-hover:bg-slate-200 transition-colors">
                  <div 
                    className={`w-full rounded-full transition-all duration-1000 ${idx === 3 ? 'bg-[#0f3f2b]' : 'bg-emerald-400 group-hover:bg-emerald-500'}`} 
                    style={{ height: `${weekData[idx]}%` }}
                  ></div>
                </div>
                <span className={`text-xs font-bold ${idx === 3 ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Gauge */}
        <div className="bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center text-center justify-between hover:shadow-md transition-shadow">
          <div className="w-full flex justify-between items-center mb-2">
            <h3 className="text-lg font-black text-slate-800">Safety Score</h3>
            <button className="text-slate-400 hover:bg-slate-50 p-2 rounded-full transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
          </div>
          <div className="relative w-full max-w-[200px] aspect-[2/1] mt-4">
            <svg viewBox="0 0 100 50" className="overflow-visible">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke={analytics.safetyScore >= 80 ? '#10b981' : analytics.safetyScore >= 50 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeDasharray={gaugeCircumference} 
                strokeDashoffset={gaugeOffset} 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-5xl font-black text-slate-800 tracking-tighter transition-all">
                {analytics.safetyScore}<span className="text-2xl text-slate-400">%</span>
              </span>
            </div>
          </div>
          <div className="mt-8 flex gap-4 w-full">
            <div className="flex-1 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-bold text-slate-500">Safe</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs font-bold text-slate-500">At Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 3. Action Required List */}
      <div className="bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-slate-800">Action Required (SIMOPS)</h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${analytics.simopsCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            {analytics.simopsCount} Pending
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.simops.length === 0 ? (
             <div className="col-span-full h-32 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400"/>
               <p className="text-sm font-bold text-slate-500">ไม่มีกิจกรรมที่พื้นที่ทับซ้อนกันในขณะนี้</p>
             </div>
          ) : analytics.simops.map(job => (
            <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 truncate max-w-[200px]">{job.jobStep}</h4>
                  <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3"/> ตรวจพบการทับซ้อน (SIMOPS)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setMitigateTarget(job)} // 👈 เมื่อกดปุ่ม ให้แสดง Modal
                className="bg-[#0f3f2b] hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 active:scale-95"
              >
                Mitigate Risk
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}