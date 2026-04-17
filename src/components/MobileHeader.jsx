import React from 'react';
import { User } from 'lucide-react';
import { APP_VERSION } from '../constants/templates';

const MobileHeader = ({ 
  reportMode, 
  onMenuToggle, 
  onProfileToggle, 
  onLogout, 
  hasWarning 
}) => {
  return (
    <div className="mobile-header" style={{ marginTop: hasWarning ? '36px' : '0' }}>
      <button className="menu-toggle" onClick={onMenuToggle}>☰</button>
      <div className="app-title">
         {reportMode === 'incident' ? 'VTSP Incident' : 'ทภก. Violator'}
         <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: '6px' }}>{APP_VERSION}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          className="header-action-btn"
          style={{ padding: '0 4px' }}
          onClick={onProfileToggle}
          title="จัดการบัญชี"
        >
          <User size={18} />
        </button>
      </div>
    </div>
  );
};

export default MobileHeader;
