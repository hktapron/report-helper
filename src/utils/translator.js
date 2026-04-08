/**
 * Standardized mapping for Thai to English phrases in Apron Control
 */
const dictionary = {
  "ได้รับแจ้งจากหอบังคับการบิน": "Received notification from Air Traffic Control (ATC)",
  "พบปัญหาทางเทคนิค": "Technical problem found",
  "ขอกลับเข้าหลุมจอดอีกครั้ง": "Requested return to bay (RTB)",
  "ดันถอยออกจากหลุมจอด": "Pushback from stand",
  "ไม่สามารถทำการ taxi ได้": "Unable to taxi",
  "จำเป็นต้องใช้รถดันอากาศยาน": "Towing service required",
  "มีผู้ป่วยหนึ่งท่าน": "One sick passenger on board",
  "สะพานเทียบมีปัญหา": "Passenger bridge technical issue",
  "ระบบ VDGS ไม่แสดงผล": "VDGS failure (No display)",
  "น้ำมันล้นปลายปีก": "Fuel spillage at wing tip",
  "เติมน้ำมันเพิ่ม": "Refueling required",
  "หลุมจอด": "Aircraft Stand / Bay",
  "สะพานเทียบอากาศยาน": "Passenger Boarding Bridge (PBB)",
  "รถนำอากาศยาน": "Follow-me Car",
  "ทางขับ": "Taxiway",
  "ทางวิ่ง": "Runway",
  "การดันถอย": "Pushback",
  "ขอกลับเข้าหลุมจอด": "Return to Bay",
  "เจ้าหน้าที่บริหารหลุมจอด": "Apron Controller",
  "ลานจอดอากาศยาน": "Apron",
  "สิ่งแปลกปลอม (ในลานจอด)": "Foreign Object Debris (FOD)",
  "สิ่งแปลกปลอมในลานจอด": "Foreign Object Debris (FOD)",
  "น้ำมันรั่ว": "Fuel Spill",
  "น้ำมันล้น": "Fuel Spill",
  "น้ำมันรั่ว/น้ำมันล้น": "Fuel Spill",
  "รถดันอากาศยาน": "Pushback Tractor",
  "ระบบนำจอด": "Visual Docking Guidance System (VDGS)",
  "เจ้าหน้าที่ให้สัญญาณ": "Marshaller",
  "การสุ่มตรวจ": "Spot Check / Random Inspection",
  "รถขนส่งอาหาร": "Catering Car",
  "ไม่มีข้อขัดข้อง": "No further issues observed",
  "เรียบร้อยแล้ว": "Completed",
  "ช่างอากาศยาน": "Aircraft Technician / Maintenance Engineers",
  "ช่างฯ": "the technician",
  "ตรวจสอบและแก้ไข": "Inspection and rectification",
  "ไม่สามารถทำการบินออกได้ตามตารางบินเดิม": "Unable to depart as per original schedule",
  "ไม่สามารถทำการบินออกได้": "Unable to depart / Flight cancellation",
  "เนื่องจากมีปัญหาเกี่ยวกับ Flaps": "due to Flaps malfunction / Technical fault",
  "ล้อยางเสื่อมสภาพตรง Main Gear ด้านขวา จำนวน1ล้อ": "1 RH Main Gear tire worn out",
  "ล้อยางเสื่อมสภาพ": "worn out tire(s)",
  "เปลี่ยนล้อยางใหม่": "tire replacement",
  "ตัวแทนสายการบินไทยเวียทเจ็ท": "Thai Vietjet representative",
  "หมดสภาพตามการใช้งาน": "end of service life",
  "ไม่ได้เกิดจากทางวิ่งและทางขับแต่อย่างใด": "not caused by runway or taxiway conditions",
  "ปัญหาทางเทคนิคอื่นๆ": "Other technical issues",
};

export const translateIncident = (text) => {
  if (!text) return '';
  let translated = text;

  // 1. Structural Regex Parsing (Contextual English)
  // Time and Dates
  translated = translated.replace(/เมื่อเวลา\s*([0-9]{2}[:.][0-9]{2})\s*น\./g, "At $1 LT,");
  translated = translated.replace(/เวลาประมาณ\s*([0-9]{2}[:.][0-9]{2})\s*น\./g, "at approximately $1 LT.");
  translated = translated.replace(/เวลาคาดว่าจะออกใหม่\s*([0-9]{2}[:.][0-9]{2})\s*น\./g, "Estimated Time of Departure (ETD) revised to $1 LT.");
  
  // Sentence Structures
  translated = translated.replace(/ได้รับแจ้งจาก(.*?)ว่า/g, "Received notification from $1 that");
  translated = translated.replace(/จากการสอบถาม(.*?)ทราบว่าสาเหตุเกิดจาก/g, "According to $1, the cause was");
  translated = translated.replace(/เที่ยวบินที่\s*([A-Za-z0-9]+)/g, "Flight $1");
  translated = translated.replace(/ซึ่งจอดอยู่ที่หลุมจอดฯ?\s*หมายเลข\s*([A-Za-z0-9]+)/g, "parked at Stand $1");
  translated = translated.replace(/ณ หลุมจอดฯ?\s*หมายเลข\s*([A-Za-z0-9]+)/g, "at Stand $1");
  translated = translated.replace(/ได้ตรวจสอบทางวิ่งและทางขับไม่พบ\s*FOD/g, "inspected the runway and taxiway and found no FOD.");

  // 2. Dictionary Keyword Replacement
  Object.entries(dictionary).forEach(([thai, english]) => {
    // Escaping regex characters potentially in Thai text or dictionary keys
    const escapedKey = thai.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    translated = translated.split(new RegExp(escapedKey, 'g')).join(english);
  });
  
  return translated;
};

export const generateCAAT22 = (data) => {
  if (!data) return 'No data available.';
  const dateStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const refNo = `HKT-APR-${Date.now().toString().slice(-6)}`;
  
  let chronology = '';
  
  // Case 1: APU Failure / Return to Stand (Explicit structural use)
  if (data.original_stand && data.return_stand) {
    chronology = `
- At ${data.incident_time || '--:--'} LT: ATC notified Apron Control that Flight ${data.flight_no || 'N/A'} pushed back from Stand ${data.original_stand} and stopped on Taxilane ${data.taxilane || 'T2'}.
- Pilot reported technical issue (APU Failure) and requested return to stand.
- Result: Apron Control assigned the aircraft to return to Stand ${data.return_stand}.
`;

    if (data.tow_time) {
      chronology += `- At ${data.tow_time} LT: ATC reported aircraft unable to taxi. Towing service deployed.
- At ${data.arrival_time || '--:--'} LT: Aircraft successfully towed and parked at Stand ${data.return_stand}.`;
    }
  } 
  // Case 2: General / Progress Report
  else {
    const narrativeRaw = data.narrative || '';
    
    // If it's a long procedural text or has line breaks, translate as a block directly
    if (narrativeRaw.includes('\n') || narrativeRaw.length > 60) {
      // Create a clean block of text by removing Thai header elements common in the copy paste
      let cleanText = narrativeRaw
        .replace(/รายงานเหตุการณ์ไม่ปกติ/g, '')
        .replace(/วันที่\s*[0-9]+\s*[ก-ฮ.]+\s*[0-9]+/g, '');
        
      chronology = translateIncident(cleanText.trim());
      
      // Append the update text if present
      if (data.update_text) {
        chronology += `\n\nUpdate: ${translateIncident(data.update_text)}`;
      }
    } 
    // Otherwise fallback to the simple one-line standard
    else {
      chronology = `- At ${data.incident_time || '--:--'} LT: ${data.narrative ? translateIncident(data.narrative) : 'Incident reported'}.
- Current Action: ${data.update_text ? translateIncident(data.update_text) : 'Monitoring the situation'}.
${data.stand_no ? `- Stand: ${data.stand_no}` : ''}`;
    }
  }

  return `
AIRPORT INCIDENT SUMMARY (CAAT-22)
----------------------------------
Ref: ${refNo}
Date: ${dateStr}
Subject: Technical Incident / Operational Disruption

FLIGHT INFORMATION:
Flight No: ${data.flight_no || 'N/A'}
A/C Registry: ${data.registration || 'N/A'}
A/C Type: ${data.ac_type || 'N/A'}
Route: ${data.route || 'N/A'}

CHRONOLOGY:
${chronology}

STATUS:
Safety protocols followed. No personnel injury reported.
Final Stand: ${data.return_stand || data.stand_no || 'N/A'}

APRON CONTROL UNIT
PHUKET INTERNATIONAL AIRPORT
`;
};
