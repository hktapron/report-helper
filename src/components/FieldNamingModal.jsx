import React, { useState, useEffect } from 'react';
import { Type, X, Link } from 'lucide-react';

const FieldNamingModal = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');

  // Reset name when opened
  useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link size={18} className="text-indigo" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>สร้างหัวข้อใหม่จากการจับคู่</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
              กรุณาระบุชื่อหัวข้อสำหรับข้อความที่คุณเลือกใน Preview
            </p>
            
            <div className="input-wrapper">
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>ชื่อหัวข้อ</label>
              <input 
                type="text" 
                className="form-control" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ทะเบียนรถ, ชื่อกัปตัน..."
                autoFocus
                required
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">สร้างหัวข้อ</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FieldNamingModal;
