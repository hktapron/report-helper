import React, { useState, useEffect } from 'react';
import { Save, Copy } from 'lucide-react';

const SaveTemplateModal = ({ isOpen, onClose, onOverwrite, onSaveNew, currentName }) => {
  const [view, setView] = useState('choice'); // 'choice' or 'naming'
  const [newName, setNewName] = useState('');

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      if (currentName?.includes('(ใหม่)')) {
        // New reports skip choice and go direct to naming
        setView('naming');
        setNewName('');
      } else {
        // Existing reports show choice first
        setView('choice');
        setNewName(currentName + " (Copy)");
      }
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onSaveNew(newName.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Save size={20} className="text-indigo" />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>บันทึกฟอร์ม</h3>
          </div>
        </div>
        
        <div className="modal-body" style={{ padding: '2.5rem 2rem' }}>
          {view === 'choice' ? (
            <>
              <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.1rem', opacity: 0.9 }}>
                คุณกำลังแก้ไขฟอร์ม <strong style={{ color: 'var(--accent-indigo)' }}>"{currentName}"</strong><br/>
                ต้องการดำเนินการอย่างไร?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '16px', 
                    width: '320px',
                    justifyContent: 'center', 
                    fontSize: '1.1rem', 
                    fontWeight: '800', 
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' 
                  }}
                  onClick={onOverwrite}
                >
                  <Save size={20} style={{ marginRight: '10px' }} /> บันทึกทับฟอร์มเดิม (Overwrite)
                </button>
                
                <button 
                  className="btn btn-outline" 
                  style={{ 
                    padding: '14px', 
                    width: '320px',
                    justifyContent: 'center', 
                    fontSize: '1rem', 
                    border: '1px solid #ddd'
                  }}
                  onClick={() => setView('naming')}
                >
                  <Copy size={18} style={{ marginRight: '8px' }} /> บันทึกเป็นฟอร์มใหม่ (Save as New)
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ marginBottom: '1.2rem', fontSize: '1rem', opacity: 0.8 }}>
                ระบุชื่อสำหรับฟอร์มใหม่:
              </p>
              <div className="input-wrapper" style={{ marginBottom: '2.5rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ fontSize: '1.2rem', padding: '15px' }}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="พิมพ์ชื่อฟอร์มที่นี่..."
                  autoFocus
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
                {!currentName?.includes('(ใหม่)') && (
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    style={{ width: '120px', justifyContent: 'center' }} 
                    onClick={() => setView('choice')}
                  >
                    กลับ
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ 
                    width: '180px', 
                    justifyContent: 'center',
                    background: 'black',
                    color: 'white',
                    border: '1px solid var(--accent-indigo)',
                    fontWeight: '600'
                  }} 
                  onClick={onClose}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ 
                    width: '180px', 
                    justifyContent: 'center', 
                    background: '#fff', 
                    color: '#000', 
                    border: '2px solid #000',
                    fontWeight: '800',
                    fontSize: '1.05rem'
                  }}
                >
                  ยืนยันการบันทึก
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveTemplateModal;
