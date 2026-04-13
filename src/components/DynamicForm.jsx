import React from 'react';
import { Trash2, Pin, FileText } from 'lucide-react';

const DynamicForm = ({
  selectedTemplate,
  reportMode,
  dynamicFields,
  formData,
  onInputChange,
  onReset,
  activeMobileTab,
  isSplitMode,
  setIsSplitMode,
  thaiPreview,
}) => {
  if (window.innerWidth <= 768 && activeMobileTab !== 'form') return null;

  return (
    <section
      className={`form-section-container ${activeMobileTab === 'form' ? 'mobile-active' : 'mobile-hidden'} ${isSplitMode ? 'split-active' : ''}`}
      style={window.innerWidth > 768 ? { flex: '0 0 55%' } : {}}
    >
      {!selectedTemplate && reportMode !== 'violator' ? (
        <div
          className="card empty-state-card"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', opacity: 0.6 }}
        >
          <FileText size={48} style={{ marginBottom: '1rem' }} />
          <p>กรุณาเลือกแม่แบบเพื่อเริ่มเขียนรายงาน</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ fontSize: '0.85rem' }}>
              {selectedTemplate?.name || (reportMode === 'incident' ? 'รายงานเหตุการณ์' : 'รายงานผู้กระทำผิด')}
            </h2>
            {window.innerWidth <= 768 && (
              <button
                className={`btn btn-ghost ${isSplitMode ? 'btn-active' : ''}`}
                style={{ fontSize: '0.65rem' }}
                onClick={() => setIsSplitMode(!isSplitMode)}
              >
                <Pin size={16} />
              </button>
            )}
            <button className="btn btn-ghost" onClick={onReset}>
              <Trash2 size={16} />
            </button>
          </div>
          <div className="form-body" key={activeMobileTab + (selectedTemplate?.id || 'none')}>
            {dynamicFields.map(field => (
              <div key={field.id} className="form-field">
                <label>{field.label}</label>
                <input
                  type="text"
                  value={formData[field.id] || ''}
                  onChange={(e) => onInputChange(field.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {isSplitMode && activeMobileTab === 'form' && window.innerWidth > 768 && (
        <div className="split-preview-overlay">
          <div className="card" style={{ height: '100%', borderRadius: 0, border: 'none' }}>
            <div className="preview-body-v2" style={{ padding: '0.5rem' }}>
              <div
                className="preview-textarea"
                dangerouslySetInnerHTML={{ __html: thaiPreview }}
                style={{ fontSize: '12px', background: 'transparent', padding: 0 }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DynamicForm;
