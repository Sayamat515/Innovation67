// src/components/MapSection.tsx
import { useState } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, Source, Layer, Popup } from 'react-map-gl/maplibre';
import { MapPin, Zap, ShieldAlert, Wrench, AlertTriangle } from 'lucide-react';
import type { JsaData } from '../types/jsa'; // 👈 เติมคำว่า type ตรงนี้
import 'maplibre-gl/dist/maplibre-gl.css';

// 🔑 ใส่ Key ของคุณ
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || 'YOUR_MAPTILER_KEY';

// 🔴 ข้อมูลโซนต่างๆ
const zoneAData = { type: 'Feature', properties: { name: 'Zone A (Structural)' }, geometry: { type: 'Polygon', coordinates: [[[101.151605, 12.673429], [101.151605, 12.672143], [101.152320, 12.672143], [101.152320, 12.673429], [101.151605, 12.673429]]] } };
const zoneBData = { type: 'Feature', properties: { name: 'Zone B (Roofing)' }, geometry: { type: 'Polygon', coordinates: [[[101.155004, 12.661978], [101.155004, 12.658477], [101.157795, 12.658477], [101.157795, 12.661978], [101.155004, 12.661978]]] } };
const combinedZonesData = { type: 'FeatureCollection', features: [zoneAData, zoneBData] };

const DEFAULT_CENTER = { lat: 12.6710, lng: 101.1540, zoom: 15.5 };

// กำหนด Props ที่ Component นี้ต้องรับมาจากไฟล์หลัก
interface MapSectionProps {
  jobs: JsaData[];
  isAddingMode: boolean;
  onLocationPick: (lat: number, lng: number) => void;
  newPin: { lat: number, lng: number } | null;
  mapMode: 'satellite' | 'streets';
}

export default function MapSection({ jobs, isAddingMode, onLocationPick, newPin, mapMode }: MapSectionProps) {
  const [viewState, setViewState] = useState({ 
    latitude: DEFAULT_CENTER.lat, 
    longitude: DEFAULT_CENTER.lng, 
    zoom: DEFAULT_CENTER.zoom 
  });
  
  const [selectedJob, setSelectedJob] = useState<JsaData | null>(null);

  // ฟังก์ชันแปลงระดับความเสี่ยงเป็นสี
  const getRiskColor = (level: string) => {
    switch (level) { 
      case 'CRITICAL': return '#e11d48'; 
      case 'HIGH': return '#f97316'; 
      case 'MEDIUM': return '#eab308'; 
      case 'LOW': return '#10b981'; 
      default: return '#94a3b8'; 
    }
  };

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      mapStyle={mapMode === 'satellite' 
        ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}` 
        : `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
      }
      style={{ width: '100%', height: '100%', cursor: isAddingMode ? 'crosshair' : 'grab' }}
      onClick={(e) => {
        if (isAddingMode) {
          // ส่งพิกัดกลับไปให้ไฟล์หลักเมื่อคลิกบนแผนที่
          onLocationPick(e.lngLat.lat, e.lngLat.lng);
        } else {
          setSelectedJob(null);
        }
      }}
    >
      <NavigationControl position="bottom-right" className="!m-4" />
      <FullscreenControl position="top-right" className="!m-4" />

      {/* วาดพื้นที่โซนการทำงาน */}
      <Source id="working-zones" type="geojson" data={combinedZonesData as any}>
        <Layer id="zone-fill" type="fill" paint={{ 'fill-color': '#3b82f6', 'fill-opacity': 0.1 }} />
        <Layer id="zone-line" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 2, 'line-dasharray': [4, 2] }} />
      </Source>

      {/* หมุดจำลองจุดใหม่ตอนผู้ใช้คลิกเล็ง */}
      {newPin && (
        <Marker latitude={newPin.lat} longitude={newPin.lng} anchor="bottom">
          <MapPin className="w-12 h-12 text-blue-500 animate-bounce drop-shadow-xl" fill="currentColor" stroke="white" strokeWidth={2} />
        </Marker>
      )}

      {/* Render หมุดงาน JSA ทั้งหมดจากข้อมูล */}
      {jobs.map((job) => (
        <Marker key={job.id} latitude={job.lat} longitude={job.lng} anchor="bottom" onClick={e => { e.originalEvent.stopPropagation(); setSelectedJob(job); }}>
          <div className="relative group cursor-pointer">
            {/* เอฟเฟกต์กระเพื่อมสำหรับงานที่เสี่ยงระดับ CRITICAL หรือเกิด SIMOPS */}
            {(job.riskLevel === 'CRITICAL' || job.simops) && (
              <div className="absolute -inset-2 bg-rose-500 rounded-full opacity-40 animate-ping"></div>
            )}
            <div className="relative z-10 flex items-center justify-center w-10 h-10 transition-transform hover:scale-110 hover:-translate-y-1">
              <MapPin className="w-10 h-10 drop-shadow-lg" style={{ color: getRiskColor(job.riskLevel) }} fill="currentColor" stroke="white" strokeWidth={1.5} />
              
              {/* ป้ายสายฟ้าเตือนภัย เมื่อเกิด SIMOPS */}
              {job.simops && (
                <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 rounded-full p-0.5 border-2 border-white shadow-sm">
                  <Zap className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        </Marker>
      ))}

      {/* Popup รายละเอียด JSA เมื่อกดที่หมุด (ดึงข้อมูลตามโครงสร้าง JSA PDF) */}
      {selectedJob && !isAddingMode && (
        <Popup latitude={selectedJob.lat} longitude={selectedJob.lng} anchor="bottom" offset={[0, -35]} onClose={() => setSelectedJob(null)} className="z-50" maxWidth="280px">
          <div className="p-2 min-w-[240px]">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedJob.area}</span>
                <h4 className="font-black text-slate-800 text-sm">{selectedJob.jsaNo}</h4>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: getRiskColor(selectedJob.riskLevel) }}>
                {selectedJob.riskLevel} (Score: {selectedJob.initialRisk})
              </span>
            </div>
            
            <div className="space-y-1.5 mb-2">
              <p className="text-xs text-slate-700 leading-tight">
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Job Step (ขั้นตอนงาน):</span> 
                {selectedJob.jobStep}
              </p>
              <p className="text-xs text-slate-700 leading-tight">
                <span className="font-bold text-slate-500 block text-[10px] uppercase flex items-center gap-1"><Wrench className="w-3 h-3"/> Tools/Equipment:</span> 
                {selectedJob.equipment}
              </p>
              
              <div className="bg-rose-50 border border-rose-100 p-1.5 rounded">
                <p className="text-[11px] text-rose-700 font-medium leading-tight">
                  <span className="font-bold block text-[10px] uppercase flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Potential Hazard:</span>
                  {selectedJob.potentialHazard}
                </p>
                <p className="text-[10px] text-rose-600 mt-1"><strong>ผลกระทบ:</strong> {selectedJob.consequence}</p>
              </div>

              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-1.5 rounded leading-tight">
                <span className="font-bold block text-[10px] uppercase">Control Measures:</span>
                {selectedJob.controlMeasures}
              </p>
            </div>

            {/* SIMOPS Alert Detail */}
            {selectedJob.simops && (
              <div className="mt-2 text-[10px] text-amber-900 font-medium bg-amber-100 p-2 rounded border border-amber-300 flex items-start gap-1.5 shadow-inner">
                <Zap className="w-4 h-4 shrink-0 mt-0.5 animate-pulse text-amber-600"/>
                <span><strong className="block text-amber-800 uppercase tracking-wide">SIMOPS Conflict:</strong> {selectedJob.simopsDetail}</span>
              </div>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}