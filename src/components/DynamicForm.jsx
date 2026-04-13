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
  isSplitMode,
  setIsSplitMode,
  thaiPreview,
}) => {
  
  // Helper to categorize fields for Incident Mode
  const getFieldGroup = (fieldId) => {
    if (['incident_time', 'narrative', 'update_text'].includes(fieldId)) return 'เหตุการณ์ (Incident)';
    if (['airline', 'flight_no', 'registration', 'ac_type'].includes(fieldId)) return 'ข้อมูลเที่ยวบิน (Flight)';
    if (['route', 'std_sta', 'ata', 'stand_no', 'location', 'original_stand', 'return_stand'].includes(fieldId)) return 'ตำแหน่งและเวลา (Logistics)';
    return 'ข้อมูลเพิ่มเติม (Details)';
  };

  // Helper to get icons for labels
  const getFieldIcon = (fieldId) => {
    if (fieldId === 'incident_time') return <Clock size={16} />;
    if (fieldId === 'narrative' || fieldId === 'update_text') return <Edit3 size={16} />;
    if (['airline', 'flight_no', 'registration', 'ac_type'].includes(fieldId)) return <Plane size={16} />;
    if (['route', 'stand_no', 'location', 'original_stand', 'return_stand'].includes(fieldId)) return <MapPin size={16} />;
    if (['std_sta', 'ata', 'std', 'arrival_time', 'pushback_time', 'departure_time'].includes(fieldId)) return <Clock size={16} />;
    if (['violator_name', 'id_card', 'company', 'position'].includes(fieldId)) return <User size={16} />;
    if (['violation_action', 'violation_detail'].includes(fieldId)) return <AlertCircle size={16} />;
    if (fieldId.includes('date') || fieldId.includes('seizure')) return <Calendar size={16} />;
    return <FileCheck size={16} />;
  };

  // Group the fields
  const groupedFields = dynamicFields.reduce((acc, field) => {
    const groupName = reportMode === 'incident' ? getFieldGroup(field.id) : 'ข้อมูลการกระทำผิด';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(field);
    return acc;
  }, {});

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

          <div className="form-scroll-body" key={selectedTemplate?.id || 'none'}>
            {Object.entries(groupedFields).map(([groupName, fields]) => (
              <div key={groupName} className="form-group-section">
                <h4 className="group-title">{groupName}</h4>
                <div className="fields-grid">
                  {fields.map(field => (
                    <div key={field.id} className={`input-wrapper ${field.type === 'textarea' ? 'full-width' : ''}`}>
                      <label className="input-label">
                        {getFieldIcon(field.id)}
                        <span>{field.label}</span>
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          placeholder={`โปรดระบุ${field.label.toLowerCase()}...`}
                          value={formData[field.id] || ''}
                          onChange={(e) => onInputChange(field.id, e.target.value)}
                        />
                      ) : (
                        <input
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
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default DynamicForm;

