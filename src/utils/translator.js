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
  "สิ่งแปลกปลอม": "Foreign Object Debris (FOD)",
  "น้ำมันรั่ว": "Fuel Spill",
  "น้ำมันล้น": "Fuel Spill",
  "รถดันอากาศยาน": "Pushback Tractor",
  "ระบบนำจอด": "Visual Docking Guidance System (VDGS)",
  "เจ้าหน้าที่ให้สัญญาณ": "Marshaller",
  "ไม่มีข้อขัดข้อง": "No further issues observed",
  "เรียบร้อยแล้ว": "Completed",
  "ช่างอากาศยาน": "Aircraft Technician",
  "ตรวจสอบและแก้ไข": "Inspection and rectification"
};

/**
 * Translates a single line of Thai text into English using regex and dictionary mapping.
 */
export const translateIncident = (text) => {
  if (!text) return '';
  let translated = text;

  // 1. Time & Quantitative Regex
  translated = translated.replace(/เมื่อเวลา\s*([0-9]{2}[:.][0-9]{2})\s*น\./g, "At $1 LT,");
  translated = translated.replace(/เวลาประมาณ\s*([0-9]{2}[:.][0-9]{2})\s*น\./g, "at approximately $1 LT.");
  translated = translated.replace(/ได้รับแจ้งจาก(.*?)ว่า/g, "Received notification from $1 that");
  translated = translated.replace(/เที่ยวบินที่\s*([A-Za-z0-9]+)/g, "Flight $1");
  translated = translated.replace(/หลุมจอดฯ?\s*หมายเลข\s*([A-Za-z0-9]+)/g, "Stand $1");

  // 2. Dictionary Mapping
  Object.entries(dictionary).forEach(([thai, english]) => {
    const escapedKey = thai.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    translated = translated.split(new RegExp(escapedKey, 'g')).join(english);
  });
  
  return translated;
};

/**
 * TOTAL REWRITE: Generates CAAT-22 plaintext report from formData state.
 * @param {object} formData - The current form state
 * @param {string} thaiText - Optional live Thai text from preview box
 */
export const generateCAAT22 = (formData, thaiText = '') => {
  if (!formData) return 'No data available.';

  // 1. Mandatory Metadata Binding (Strict from State)
  const flightNo = formData.flight_no || 'N/A';
  const registration = formData.registration || 'N/A';
  const acType = formData.ac_type || 'N/A';
  const route = formData.route || 'N/A';
  const standNo = formData.stand_no || formData.return_stand || 'N/A';
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB'); // DD/MM/YYYY
  
  // 2. Smart Narrative Extraction (CHRONOLOGY ONLY)
  // Use thaiText if provided, otherwise fallback to formData
  const rawThaiText = thaiText || (formData.narrative || '') + (formData.update_text ? '\n' + formData.update_text : '');
  const lines = rawThaiText.split('\n');
  
  // Blacklist for common Thai headers that shouldn't be in the English chronology
  const blacklist = [
    /รายงานเหตุการณ์ไม่ปกติ/i,
    /วันที่ [0-9]/i,
    /หากมีความคืบหน้า/i,
    /รายละเอียดเที่ยวบิน/i,
    /Apron Control Tel/i
  ];

  const chronologyLines = lines
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // 1. Priority: Keep numbered lines
      if (/^[0-9]+[\.\)]/.test(trimmed)) return true;
      // 2. Fallback: Keep other lines as long as they aren't in the blacklist
      return !blacklist.some(regex => regex.test(trimmed));
    })
    .map(line => {
      const trimmed = line.trim();
      const needsPrefix = !/^[0-9]+[\.\)]/.test(trimmed);
      return `${needsPrefix ? '- ' : ''}${translateIncident(trimmed)}`;
    });

  // Fallback if no narrative lines found at all
  const chronologyText = chronologyLines.length > 0 
    ? chronologyLines.join('\n') 
    : `- At ${formData.incident_time || '--:--'} LT: Incident reported`;

  // 3. Assembly (Pinpoint parity with CAAT-22 format)
  return `AIRPORT INCIDENT SUMMARY (CAAT-22)
----------------------------------
Date: ${dateStr}
Subject: Technical Incident / Operational Disruption

FLIGHT INFORMATION:
Flight No: ${flightNo}
A/C Registry: ${registration}
A/C Type: ${acType}
Route: ${route}

CHRONOLOGY:
${chronologyText}

STATUS:
Safety protocols followed. No personnel injury reported.
Final Stand: ${standNo}

APRON CONTROL UNIT
PHUKET INTERNATIONAL AIRPORT`;
};
