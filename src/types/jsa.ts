// src/types/jsa.ts

export interface JsaData {
  id: string;
  jsaNo: string;
  jobStep: string; // ขั้นตอนการทำงาน[cite: 1]
  equipment: string; // เครื่องมือ/อุปกรณ์[cite: 1]
  potentialHazard: string; // อันตรายที่อาจเกิดขึ้น[cite: 1]
  consequence: string; // ผลกระทบที่อาจเกิดขึ้น[cite: 1]
  initialRisk: number; // ความเสี่ยงก่อนการควบคุม (Score)[cite: 1]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  controlMeasures: string; // มาตรการควบคุมความเสี่ยง[cite: 1]
  
  // พิกัดสำหรับแสดงบนแผนที่ (Innovation)
  lat: number;
  lng: number;
  area: string;
  
  // ระบบ SIMOPS (Innovation)
  simops: boolean;
  simopsDetail: string;
}