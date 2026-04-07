import React from 'react';

const ModeSelector = ({ onSelect }) => {
  return (
    <div className="login-container">
      <div className="login-card" style={{ width: '600px', textAlign: 'center' }}>
        <h1 className="app-title" style={{ justifyContent: 'center', fontSize: '1.5rem', marginBottom: '2rem' }}>
          <span>✈️</span> ระบบจัดทำรายงานอัตโนมัติ (HKT)
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          กรุณาเลือกประเภทรายงานที่ท่านต้องการดำเนินการ:
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div 
            className="card" 
            style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => onSelect('incident')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ marginBottom: '0.5rem' }}>รายงานเหตุการณ์ไม่ปกติ</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>อุบัติการณ์, ความล่าช้า, และรายงาน กพท.</p>
          </div>

          <div 
            className="card" 
            style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => onSelect('violator')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🆔</div>
            <h3 style={{ marginBottom: '0.5rem' }}>รายงานผู้กระทำความผิด</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ฝ่าฝืนกฎจราจร และการยึดบัตรอนุญาต</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
