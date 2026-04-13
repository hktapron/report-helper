import React from 'react';
import { FileText, Gavel } from 'lucide-react';

const ModeSelector = ({ onSelect }) => {
  return (
    <div className="login-container mode-selector-container">
      <div className="mode-card">
        <h1 className="app-title" style={{ justifyContent: 'center', fontSize: '1.4rem', marginBottom: '1rem', textAlign: 'center' }}>
          ระบบช่วยจัดทำรายงานเหตุการณ์
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem', textAlign: 'center' }}>
          กรุณาเลือกประเภทรายงาน:
        </p>
        
        <div className="mode-grid">
          <div className="mode-item" onClick={() => onSelect('incident')}>
            <span className="mode-icon">
              <FileText size={42} strokeWidth={1.5} />
            </span>
            <h2 style={{ fontSize: '1rem', marginBottom: '0.4rem', fontWeight: 'bold' }}>เหตุการณ์ไม่ปกติ</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', lineHeight: '1.4', textAlign: 'center', maxWidth: '140px' }}>
              แบบฟอร์มบันทึกเหตุการณ์ทางเทคนิค, ปัญหาหลุมจอด
            </p>
          </div>
          
          <div className="mode-item" onClick={() => onSelect('violator')}>
            <span className="mode-icon">
              <Gavel size={42} strokeWidth={1.5} />
            </span>
            <h2 style={{ fontSize: '1rem', marginBottom: '0.4rem', fontWeight: 'bold' }}>ผู้กระทำความผิด</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', lineHeight: '1.4', textAlign: 'center', maxWidth: '140px' }}>
               บันทึกการกระทำความผิดกฎจราจรและยึดบัตร
            </p>
          </div>
        </div>

        <div style={{ marginTop: '3.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.6', opacity: 0.7 }}>
          งานบริการเขตการบิน ส่วนปฏิบัติการเขตการบิน<br/>
          ฝ่ายปฏิบัติการเขตการบิน ท่าอากาศยานภูเก็ต
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
