import React from 'react';
import { 
  Trash2, Pin, FileText, Clock, Edit3, 
  Plane, MapPin, User, AlertCircle, Calendar, 
  FileCheck, ArrowRight 
} from 'lucide-react';

const DynamicForm = ({
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
        <div className="premium-form-container">
          <div className="form-header-bar">
            <div className="form-title-group">
              <div className={`status-dot ${reportMode}`} />
              <h2>{selectedTemplate?.name || (reportMode === 'incident' ? 'รายงานเหตุการณ์ไม่ปกติ' : 'รายงานผู้กระทำความผิด')}</h2>
            </div>
            
            <div className="form-header-actions">
              {window.innerWidth <= 768 && (
                <button
                  className={`btn-icon-toggle ${isSplitMode ? 'active' : ''}`}
                  onClick={() => setIsSplitMode(!isSplitMode)}
                  title="แบ่งหน้าจอ"
                >
                  <Pin size={18} />
                </button>
              )}
              <button className="btn-icon-danger" onClick={onReset} title="ล้างข้อมูล">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="form-scroll-body" key={selectedTemplate?.id || 'none'} style={{ padding: '1.25rem', paddingBottom: '80px' }}>
            <div className="form-category-card unified-card" style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '24px', 
              padding: '1.75rem', 
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: 'var(--accent-indigo)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                 <Plane size={20} color="var(--accent-indigo)" />
                 <h4 className="group-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>ข้อมูลเที่ยวบิน (Flight)</h4>
              </div>
              
              <div className="fields-grid">
                {dynamicFields.map(field => (
                  <div key={field.id} className={`input-wrapper ${field.type === 'textarea' ? 'full-width' : ''}`} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '800' }}>
                      {/* Using generic icon for simplicity in unified view */}
                      <FileCheck size={16} />
                      <span>{field.label}</span>
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        placeholder={`ระบุ${field.label.toLowerCase()}...`}
                        value={formData[field.id] || ''}
                        onChange={(e) => onInputChange(field.id, e.target.value)}
                        style={{ width: '100%', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', minHeight: '160px', fontSize: '1.05rem', color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <input
                        type={field.type === 'time' ? 'text' : (field.type || 'text')}
                        placeholder={field.type === 'time' ? 'เช่น 1430' : ''}
                        value={formData[field.id] || ''}
                        onChange={(e) => onInputChange(field.id, e.target.value)}
                        style={{ width: '100%', borderRadius: '16px', padding: '0 16px', border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', height: '56px', fontSize: '1.1rem', color: 'var(--text-primary)' }}
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

export default DynamicForm;

