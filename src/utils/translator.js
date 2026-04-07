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
  
  // Replace known phrases
  Object.entries(dictionary).forEach(([thai, english]) => {
    translated = translated.split(thai).join(english);
  });

  return translated;
};

export const generateCAAT22 = (data) => {
  const dateStr = new Date().toISOString().split('T')[0];
  return `
CAAT INCIDENT REPORT (CAAT-22 EQUIVALENT)
-----------------------------------------
REF: HKT-APR-${Date.now().toString().slice(-6)}
DATE: ${dateStr}
SUBJECT: Technical Incident / Return to Bay

DETAILS:
Flight: ${data.flight_no || 'N/A'}
A/C Type: ${data.ac_type || 'N/A'}
Registration: ${data.registration || 'N/A'}

CHRONOLOGY:
- At ${data.incident_time || '--:--'} LT: Incident reported.
- Action: ${data.issue_desc || 'Technical evaluation requested'}.
- Result: ${data.return_stand ? `A/C returned to stand ${data.return_stand}` : 'Continuous monitoring'}.

PRELIMINARY ASSESSMENT:
The flight ${data.flight_no} experienced ${data.issue_desc || 'system failure'} during ${data.pushback_time ? 'pushback' : 'taxiing'}. 
Safety protocols followed. No injury reported.

APRON CONTROL UNIT
PHUKET INTERNATIONAL AIRPORT
`;
};
