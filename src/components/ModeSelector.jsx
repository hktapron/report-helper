import React from 'react';

const ModeSelector = ({ onSelect }) => {
  return (
    <div className="login-container">
      <div className="mode-card">
        <h1 className="app-title" style={{ justifyContent: 'center', fontSize: '2.2rem', marginBottom: '1.5rem' }}>
          ระบบช่วยจัดทำรายงานเหตุการณ์ไม่ปกติ
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '3rem' }}>
          กรุณาเลือกประเภทรายงานที่ท่านต้องการดำเนินการ:
        </p>
        
        <div className="mode-grid">
          <div className="mode-item" onClick={() => onSelect('incident')}>
            <span className="mode-icon">📋</span>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>รายงานเหตุการณ์ไม่ปกติ</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'center' }}>
              บันทึกเหตุการณ์ทางเทคนิค, ปัญหาหลุมจอด<br/>
              และเหตุการณ์อื่นๆ
            </p>
          </div>
          
          <div className="mode-item" onClick={() => onSelect('violator')}>
            <span className="mode-icon">⚖️</span>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>รายงานผู้กระทำความผิด</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>บันทึกการกระทำความผิดกฎจราจร และการยึดบัตรอนุญาตเข้าเขตการบิน</p>
          </div>
        </div>

        <div style={{ marginTop: '4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ฝ่ายปฏิบัติการเขตการบิน ท่าอากาศยานภูเก็ต
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
