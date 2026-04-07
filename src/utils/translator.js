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
  "ไม่มีข้อขัดข้อง": "No further issues observed",
  "เรียบร้อยแล้ว": "Completed",
};

export const translateIncident = (text) => {
  let translated = text;
  Object.entries(dictionary).forEach(([thai, english]) => {
    translated = translated.split(thai).join(english);
  });
  return translated;
};

export const generateCAAT22 = (data) => {
  const dateStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const refNo = `HKT-APR-${Date.now().toString().slice(-6)}`;
  
  let chronology = '';
  
  // Case 1: APU Failure / Return to Stand
  if (data.original_stand && data.return_stand) {
    chronology = `
- At ${data.incident_time || '--:--'} LT: ATC notified Apron Control that Flight ${data.flight_no} pushed back from Stand ${data.original_stand} and stopped on Taxilane ${data.taxilane || 'T2'}.
- Pilot reported technical issue (APU Failure) and requested return to stand.
- Result: Apron Control assigned the aircraft to return to Stand ${data.return_stand}.
`;

    // Add Towing if data exists
    if (data.tow_time) {
      chronology += `- At ${data.tow_time} LT: ATC reported aircraft unable to taxi. Towing service deployed.
- At ${data.arrival_time || '--:--'} LT: Aircraft successfully towed and parked at Stand ${data.return_stand}.`;
    }
  } 
  // Case 2: General / Progress Report
  else {
    chronology = `- At ${data.incident_time || '--:--'} LT: ${data.narrative ? translateIncident(data.narrative) : 'Incident reported'}.
- Current Action: ${data.update_text ? translateIncident(data.update_text) : 'Monitoring the situation'}.
${data.stand_no ? `- Stand: ${data.stand_no}` : ''}`;
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
