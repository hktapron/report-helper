import React from 'react';

const DemoWarning = ({ isVisible }) => {
  if (isVisible) return null; // Assuming isVisible refers to Supabase presence, but we'll use a clearer prop
  return null;
};

// Actually, let's keep it simple as in App.jsx
const DemoWarningBlock = ({ show }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(239, 68, 68, 0.9)',
      color: 'white',
      padding: '8px 16px',
      textAlign: 'center',
      fontSize: '12px',
      fontWeight: 600,
      zIndex: 9999,
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      ⚠️ ฐานข้อมูลไม่ได้เชื่อมต่อ (Missing Supabase Config) | โหมดสาธิต (Admin/Admin) ทำงานอยู่
    </div>
  );
};

export default DemoWarningBlock;
