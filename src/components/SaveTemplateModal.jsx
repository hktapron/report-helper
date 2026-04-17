import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const SaveTemplateModal = ({ isOpen, onClose, onSaveNew, currentName }) => {
  const [newName, setNewName] = useState('');

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      // Logic from Phase 22: Blank input for "(ใหม่)" reports, else add (Copy)
      if (currentName?.includes('(ใหม่)')) {
        setNewName('');
      } else {
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
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Save size={20} className="text-indigo" />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>บันทึกแม่แบบฟอร์ม</h3>
          </div>
        </div>
        
        <div className="modal-body" style={{ padding: '2rem 1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
              ระบุชื่อสำหรับแบบฟอร์มใหม่:
            </p>
            <div className="input-wrapper" style={{ marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                className="form-control" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ระบุชื่อสำหรับแบบฟอร์มใหม่..."
                autoFocus
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ flex: 1, border: '1px solid #ddd', justifyContent: 'center' }} 
                onClick={onClose}
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 2, justifyContent: 'center' }}
              >
                ยืนยันการบันทึก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SaveTemplateModal;
