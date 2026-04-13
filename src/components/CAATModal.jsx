import React from 'react';

const CAATModal = ({ isOpen, onClose, translatedCAAT, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="app-title" style={{ fontSize: '1.1rem' }}>พรีวิว: รูปแบบรายงาน กพท.22</div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <pre className="caat-preview-text">{translatedCAAT}</pre>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary btn-mode-switch" onClick={onConfirm}>
            ยืนยันการแปลและคัดลอก
          </button>
        </div>
      </div>
    </div>
  );
};

export default CAATModal;
