import { useState, useRef, useEffect } from 'react';
import { Flame, GripHorizontal, XCircle, Check, Bell, User } from 'lucide-react';
import * as turf from '@turf/turf'; // 👈 นำเข้าสมองกลคำนวณระยะทาง

import type { JsaData } from './types/jsa';
import { initialJsaData } from './data/mockJsaData';

// นำเข้า Components ย่อยทั้งหมด
import Sidebar from './components/Sidebar';
import MapSection from './components/MapSection';
import DataTable from './components/DataTable';
import DashboardOverview from './components/DashboardOverview';

export default function VisualJSADashboard() {
  // 📦 State สำหรับจัดการข้อมูล JSA
  const [jobs, setJobs] = useState<JsaData[]>(initialJsaData);
  
  // 🌟 State สำหรับสลับหน้า (Dashboard vs Map)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map'>('dashboard');

  // 🗺️ State สำหรับแผนที่และการลากหน้าจอ
  const [mapHeight, setMapHeight] = useState(55);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'streets'>('satellite');

  // 🎯 State สำหรับโหมด "เพิ่ม JSA (Add JSA)"
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPin, setNewPin] = useState<{lat: number, lng: number} | null>(null);

  // 📝 State สำหรับฟอร์มกรอกข้อมูล JSA ใหม่
  const [formJobStep, setFormJobStep] = useState('งานเชื่อมเหล็กโครงสร้างหลังคา');
  const [formRisk, setFormRisk] = useState<'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'>('HIGH');

  // 🖱️ ระบบลากปรับขนาดจอ (Draggable Resizer)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); setIsDragging(true); };
  
  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newHeight = ((clientY - containerRect.top) / containerRect.height) * 100;
      if (newHeight < 20) newHeight = 20; if (newHeight > 85) newHeight = 85;
      setMapHeight(newHeight);
    };
    const handleDragEnd = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove); window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false }); window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove); window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove); window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  // 📍 เมื่อผู้ใช้คลิกเล็งพิกัดบนแผนที่
  const handleLocationPick = (lat: number, lng: number) => {
    setNewPin({ lat, lng });
    setShowAddModal(true);
    setIsAddingMode(false); // ปิดโหมดเล็งเป้า
  };

  // 🚀 THE BRAIN: ฟังก์ชันบันทึกและคำนวณ SIMOPS อัตโนมัติ
  const handleSaveNewJSA = () => {
    if (!newPin) return;

    let isSimops = false;
    let simopsMessage = '';
    
    // สร้างพิกัดใหม่ในรูปแบบที่ Turf.js เข้าใจ
    const newPoint = turf.point([newPin.lng, newPin.lat]);

    // วนลูปเช็คระยะห่างกับงานที่มีอยู่แล้วในระบบ
    const updatedJobs = jobs.map(existingJob => {
      const existingPoint = turf.point([existingJob.lng, existingJob.lat]);
      const distance = turf.distance(newPoint, existingPoint, { units: 'meters' });

      // 🔴 ถ้าระยะห่างน้อยกว่า 20 เมตร ถือว่าเกิด SIMOPS
      if (distance < 20) {
        isSimops = true;
        simopsMessage = `พื้นที่ทับซ้อนกับงาน: ${existingJob.jobStep} (ห่างเพียง ${distance.toFixed(1)} เมตร)`;
        
        // อัปเดตงานเดิมให้ติดสถานะเตือนด้วย
        return {
          ...existingJob,
          simops: true,
          simopsDetail: `แจ้งเตือน! มีงานใหม่เข้ามาใกล้: ${formJobStep} (ระยะ ${distance.toFixed(1)} เมตร)`
        };
      }
      return existingJob;
    });

    // สร้างข้อมูล JSA งานใหม่
    const newJob: JsaData = {
      id: Date.now().toString(),
      jsaNo: `JSA-NEW-00${jobs.length + 1}`,
      jobStep: formJobStep,
      equipment: 'เครื่องเชื่อมไฟฟ้า, ถังดับเพลิง',
      potentialHazard: 'สะเก็ดไฟจากการเชื่อม ใกล้วัสดุไวไฟหรือพื้นที่ทำงานอื่น',
      consequence: 'ไฟไหม้, ผู้ปฏิบัติงานข้างเคียงบาดเจ็บ',
      initialRisk: formRisk === 'CRITICAL' ? 20 : formRisk === 'HIGH' ? 15 : 10,
      riskLevel: formRisk,
      controlMeasures: 'ใช้แผ่นกันประกายไฟ (Fire Blanket) คลุมพื้นที่ เฝ้าระวังขณะทำงาน',
      lat: newPin.lat,
      lng: newPin.lng,
      area: newPin.lat > 12.665 ? 'Zone A (Structural)' : 'Zone B (Roofing)',
      simops: isSimops,
      simopsDetail: simopsMessage
    };

    // อัปเดตตารางและแผนที่
    setJobs([...updatedJobs, newJob]);
    setShowAddModal(false);
    setNewPin(null);
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-[#f8fafc] font-['Outfit','Noto_Sans_Thai',sans-serif] overflow-hidden">
      
      {/* ⚪ TOP HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between bg-white px-5 border-b border-slate-100 z-40 relative shadow-sm">
        <div className="flex items-center gap-3">
          {/* ไอคอนโลโก้ */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm">
            <Flame className="w-5 h-5"/>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">Risk Assessment</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visual JSA Dashboard by G1</span>
          </div>
        </div>
        
        {/* 🌟 Tab Switcher (ตรงกลาง Header) */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('map')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Map View
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* กระดิ่งแจ้งเตือน */}
          <button className="relative p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
          </button>

          {/* โปรไฟล์ผู้ใช้ */}
          <div className="flex items-center gap-2 pl-4 border-l border-slate-100 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-slate-800">Test Admin</p>
              <p className="text-[9px] font-bold text-slate-400">Safety Engineer</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200">
              <User className="w-5 h-5 text-slate-500"/>
            </div>
          </div>
        </div>
      </header>

      {/* 🌟 สลับเนื้อหาระหว่าง Dashboard และ Map View */}
      {activeTab === 'dashboard' ? (
        <DashboardOverview jobs={jobs} />
      ) : (
        <div className="flex flex-1 overflow-hidden relative animate-in fade-in duration-300">
          
          {/* 🟡 SIDEBAR (สำหรับหน้า Map) */}
          <Sidebar 
            jobs={jobs} 
            isAddingMode={isAddingMode} 
            onToggleAddMode={() => { setIsAddingMode(!isAddingMode); setShowAddModal(false); }} 
          />

          {/* 🟢 MAIN CONTENT (Map & Table) */}
          <main ref={containerRef} className="relative flex flex-1 flex-col overflow-hidden min-w-0 bg-slate-50">
            
            {/* ป้ายเตือนตอนอยู่ในโหมดเล็งแผนที่ */}
            {isAddingMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-2 rounded-full font-bold shadow-xl flex items-center gap-2 animate-bounce">
                คลิกบนแผนที่เพื่อระบุตำแหน่งที่ตั้งงาน
              </div>
            )}

            {/* 🗺️ MAP SECTION */}
            <div style={{ height: `${mapHeight}%` }} className="relative w-full bg-slate-800 overflow-hidden md:border-l border-slate-200">
              
              {/* ปุ่มสลับโหมดแผนที่ถูกย้ายมาอยู่ในมุมแผนที่แทน */}
              <div className="absolute top-4 left-4 z-10 flex bg-white/90 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-sm">
                <button onClick={() => setMapMode('satellite')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase transition-all ${mapMode === 'satellite' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>Satellite</button>
                <button onClick={() => setMapMode('streets')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase transition-all ${mapMode === 'streets' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>Street</button>
              </div>

              <MapSection 
                jobs={jobs} 
                isAddingMode={isAddingMode} 
                onLocationPick={handleLocationPick} 
                newPin={newPin}
                mapMode={mapMode}
              />

              {/* 📝 Modal ฟอร์มสร้าง JSA (ลอยทับแผนที่) */}
              {showAddModal && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 w-80 border border-slate-100">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-black text-lg text-slate-800">Add New JSA</h3>
                    <button onClick={() => { setShowAddModal(false); setNewPin(null); }} className="text-slate-400 hover:text-slate-600 transition-colors"><XCircle className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Job Step (ประเภทงาน)</label>
                      <select value={formJobStep} onChange={(e) => setFormJobStep(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all bg-slate-50 hover:bg-white">
                        <option>งานเชื่อมเหล็กโครงสร้างหลังคา</option>
                        <option>งานพ่นสีและทาเคมีภัณฑ์</option>
                        <option>งานรื้อถอนนั่งร้านชั่วคราว</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Risk Level (ระดับความเสี่ยง)</label>
                      <select value={formRisk} onChange={(e) => setFormRisk(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold transition-all bg-slate-50 hover:bg-white">
                        <option value="CRITICAL">CRITICAL (แดง)</option>
                        <option value="HIGH">HIGH (ส้ม)</option>
                        <option value="MEDIUM">MEDIUM (เหลือง)</option>
                      </select>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-xl text-[10px] text-slate-500 font-mono text-center">
                      Lat: {newPin?.lat.toFixed(5)}, Lng: {newPin?.lng.toFixed(5)}
                    </div>
                    
                    <button onClick={handleSaveNewJSA} className="w-full bg-[#0f3f2b] hover:bg-emerald-900 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 shadow-sm transition-all active:scale-95 mt-2">
                      <Check className="w-4 h-4" /> Save & Calculate Risk
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 🎚️ แถบลากปรับขนาด (Draggable Handle) */}
            <div className={`h-4 w-full bg-[#f8fafc] border-y border-slate-200 cursor-row-resize flex items-center justify-center hover:bg-slate-200 transition-colors z-10 shrink-0 ${isDragging ? 'bg-slate-200' : ''}`} onMouseDown={handleDragStart} onTouchStart={handleDragStart}>
              <GripHorizontal className="w-5 h-5 text-slate-300" />
            </div>

            {/* 📋 DATA TABLE SECTION */}
            <div style={{ height: `calc(${100 - mapHeight}% - 16px)` }} className="flex flex-col overflow-hidden bg-white md:border-l border-slate-200">
              <DataTable 
                jobs={jobs} 
                onFocusJob={(lat, lng) => {
                  console.log("Focus to:", lat, lng);
                }} 
              />
            </div>

          </main>
        </div>
      )}
    </div>
  );
}