import React from 'react';
import { 
  Trash2, Pin, FileText, Clock, Edit3, 
  Plane, MapPin, User, AlertCircle, Calendar, 
  FileCheck, ArrowRight 
} from 'lucide-react';

const ReportForm = ({
  selectedTemplate,
  reportMode,
  dynamicFields,
  formData,
  onInputChange,
  onReset,
  activeMobileTab,
  setActiveMobileTab,
  isSplitMode = false,
  setIsSplitMode,
  thaiPreview,
}) => {
  
  // No grouping logic needed for unified layout

  return (
    <section
      className={`form-section-container ${activeMobileTab === 'form' ? 'mobile-active' : 'mobile-hidden'} ${isSplitMode ? 'split-mode-active' : ''}`}
      style={window.innerWidth > 768 ? { flex: '0 0 55%' } : {}}
    >
      {!selectedTemplate && reportMode !== 'violator' ? (
        <div className="empty-state-container">
          <FileText size={64} className="empty-icon" />
          <h3>ยังไม่ได้เลือกฟอร์ม</h3>
          <p>กรุณาเลือกแม่แบบรายงานจากแถบ "ฟอร์มเหตุการณ์" เพื่อเริ่มกรอกข้อมูล</p>
          {window.innerWidth <= 768 && (
             <button className="btn btn-primary" onClick={() => setActiveMobileTab?.('templates')}>
               ไปที่หน้าเลือกฟอร์ม <ArrowRight size={16} />
             </button>
          )}
        </div>
      ) : (
        <div className="premium-form-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Hide internal header on mobile for unified layout */}
          {window.innerWidth > 768 && (
            <div className="form-header-bar">
              <div className="form-title-group">
                <div className={`status-dot ${reportMode}`} />
                <h2>{selectedTemplate?.name || (reportMode === 'incident' ? 'รายงานเหตุการณ์ไม่ปกติ' : 'รายงานผู้กระทำความผิด')}</h2>
              </div>
              
              <div className="form-header-actions">
                <button className="btn-icon-danger" onClick={onReset} title="ล้างข้อมูล">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="form-scroll-body" key={selectedTemplate?.id || 'none'}>
            <div 
              className="form-category-card unified-card"
              style={{
                ...(window.innerWidth <= 768 ? {
                  position: 'relative',
                  width: '100vw',
                  left: '50%',
                  right: '50%',
                  marginLeft: '-50vw',
                  marginRight: '-50vw',
                  borderRadius: '0px',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '1rem' // Inner breathing room
                } : {})
              }}
            >
              <div className="card-indicator" />
              
              <div className="group-header">
                 <Plane size={16} color="var(--accent-indigo)" />
                 <h4 className="group-title">ข้อมูลเที่ยวบิน (Flight)</h4>
              </div>
              
              <div className="fields-grid">
                {dynamicFields.map(field => (
                  <div key={field.id} className={`input-wrapper ${field.type === 'textarea' ? 'full-width' : ''}`} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
                    <label className="input-label">
                      <FileCheck size={12} />
                      <span>{field.label}</span>
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="form-input"
                        placeholder={`ระบุ${field.label.toLowerCase()}...`}
                        value={formData[field.id] || ''}
                        onChange={(e) => onInputChange(field.id, e.target.value)}
                      />
                    ) : (
                      <input
                        className="form-input"
                        type={field.type === 'time' ? 'text' : (field.type || 'text')}
                        placeholder={field.type === 'time' ? 'เช่น 1430' : ''}
                        value={formData[field.id] || ''}
                        onChange={(e) => onInputChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReportForm;

