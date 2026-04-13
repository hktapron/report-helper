import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("VTSP FATAL ERROR CAUGHT:", error, errorInfo);
  }

  handleHardReset = () => {
    if (window.confirm("คำเตือน: นี่คือการล้างข้อมูลทั้งหมดในเครื่องเพื่อกู้คืนระบบ (Hard Reset). ต้องการดำเนินการต่อหรือไม่?")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#0f172a',
          color: 'white',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>
            ตรวจพบข้อผิดพลาดร้ายแรง (System Crash)
          </h1>
          <p style={{ color: '#94a3b8', maxWidth: '400px', marginBottom: '2rem', fontSize: '0.9rem' }}>
            รหัสโปรแกรมเกิดการขัดข้องกะทันหัน ซึ่งอาจเกิดจากข้อมูลเก่าที่ค้างอยู่ในเครื่องผิดพลาด
          </p>
          
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            fontSize: '0.75rem',
            color: '#f87171',
            maxWidth: '500px',
            overflow: 'auto'
          }}>
            Error: {this.state.error?.message || "Unknown Runtime Error"}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#334155',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ลองโหลดใหม่ (Reload)
            </button>
            <button
              onClick={this.handleHardReset}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              กู้คืนระบบ (Hard Reset)
            </button>
          </div>
          
          <p style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#475569' }}>
            VTSP Workstation Recovery Mode
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
