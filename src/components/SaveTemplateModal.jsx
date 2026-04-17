import React, { useState, useEffect } from 'react';
import { Save, Copy, X, Type } from 'lucide-react';

const SaveTemplateModal = ({ isOpen, onClose, onOverwrite, onSaveNew, currentName }) => {
  const [view, setView] = useState('choice'); // 'choice' or 'naming'
  const [newName, setNewName] = useState('');

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setView('choice');
      setNewName(currentName + " (Copy)");
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSaveNewSubmit = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onSaveNew(newName.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Save size={20} className="text-indigo" />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>บันทึกแม่แบบฟอร์ม</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body" style={{ padding: '2rem 1.5rem' }}>
          {view === 'choice' ? (
            <>
              <p style={{ textAlign: 'center', marginBottom: '1.5rem', opacity: 0.9 }}>
                คุณกำลังแก้ไขฟอร์ม <strong style={{ color: 'var(--accent-indigo)' }}>"{currentName}"</strong><br/>
                ต้องการดำเนินการอย่างไร?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '12px', justifyContent: 'center', fontSize: '1rem' }}
                  onClick={onOverwrite}
                >
                  <Save size={18} style={{ marginRight: '8px' }} /> บันทึกทับฟอร์มเดิม (Overwrite)
                </button>
                
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '12px', justifyContent: 'center', fontSize: '1rem', border: '1px solid var(--accent-indigo)', color: 'var(--accent-indigo)' }}
                  onClick={() => setView('naming')}
                >
                  <Copy size={18} style={{ marginRight: '8px' }} /> บันทึกเป็นฟอร์มใหม่ (Save as New)
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveNewSubmit}>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                ระบุชื่อสำหรับแบบฟอร์มใหม่:
              </p>
              <div className="input-wrapper" style={{ marginBottom: '1.5rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setView('choice')}>กลับ</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>ยืนยันการบันทึก</button>
              </div>
            </form>
          )}
        </div>
        
        {view === 'choice' && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveTemplateModal;
