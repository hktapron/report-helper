import { useMemo } from 'react';

const FIELD_LABELS = {
  report_time: 'เวลาเกิดเหตุ',
  informant: 'ผู้แจ้ง',
  flight_no: 'เที่ยวบิน',
  atc_time: 'เวลาที่คาดว่าถึง ทภก.',
  original_airport: 'สนามบินต้นทาง',
  stand: 'หลุมจอดฯ',
  ac_reg: 'ทะเบียนเครื่อง',
  ac_type: 'แบบอากาศยาน',
  route: 'เส้นทางบิน',
  departure_time: 'เวลาออกจาก ทภก.',
  // violator fields
  incident_time: 'เวลาเกิดเหตุ',
  violator_name: 'ชื่อผู้กระทำความผิด',
  id_card: 'หมายเลขบัตร',
  company: 'สังกัด',
  position: 'ตำแหน่ง',
  vehicle_type: 'ประเภทรถ',
  vehicle_no: 'หมายเลขรถ',
  location: 'บริเวณ',
  seizure_days: 'วันยึดบัตร',
  seizure_start: 'เริ่มยึดวันที่',
  seizure_end: 'ถึงวันที่',
  retraining_date: 'วันอบรม',
};

const toField = (id) => ({ id, label: FIELD_LABELS[id] || id });

export const useDynamicFields = (selectedTemplate, reportMode) => {
  return useMemo(() => {
    if (!selectedTemplate) {
      if (reportMode === 'incident') return [
        toField('report_time'), toField('informant'), toField('flight_no'),
        toField('atc_time'), toField('original_airport'), toField('stand'),
        toField('ac_reg'), toField('ac_type'), toField('route'),
      ];
      return [
        toField('incident_time'), toField('violator_name'), toField('id_card'),
        toField('company'), toField('position'), toField('vehicle_type'),
        toField('vehicle_no'), toField('location'), toField('seizure_days'),
        toField('seizure_start'), toField('seizure_end'), toField('retraining_date'),
      ];
    }

    const body = selectedTemplate.preview || selectedTemplate.content || "";
    const keys = [];

    // PRIMARY: DOM scan in document order
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(body, 'text/html');
      doc.querySelectorAll('[data-field]').forEach(el => {
        const k = el.getAttribute('data-field');
        if (k && !keys.includes(k.trim())) keys.push(k.trim());
      });
    } catch (e) {
      const attrRegex = /data-field=["']([^"']+)["']/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(body)) !== null) {
        const k = attrMatch[1].trim();
        if (!keys.includes(k)) keys.push(k);
      }
    }

    // SECONDARY: {braces} scan for raw templates
    const textOnly = body.replace(/<[^>]*>?/gm, ' ');
    const braceRegex = /\{([^{}]+)\}|\[([^\[\]]+)\]/g;
    let braceMatch;
    while ((braceMatch = braceRegex.exec(textOnly)) !== null) {
      const k = (braceMatch[1] || braceMatch[2])?.trim();
      if (k && !keys.includes(k)) keys.push(k);
    }

    return keys.map(toField);
  }, [selectedTemplate, reportMode]);
};
