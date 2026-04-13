import React from 'react';
import { Sparkles, Copy, Trash2, Columns, Check } from 'lucide-react';

const QuickTools = ({ 
  onCAATTranslate, 
  isLoadingCAAT, 
  thaiPreview, 
  onReset,
  isSplitMode,
  setIsSplitMode,
  activeMobileTab 
}) => {
  const [copiedThai, setCopiedThai] = React.useState(false);

  const handleCopyThai = () => {
    navigator.clipboard.writeText(thaiPreview);
    setCopiedThai(true);
    setTimeout(() => setCopiedThai(false), 2000);
  };

  if (activeMobileTab !== 'tools') return null;

  return (
    <div className="quick-tools-view">
      <div className="tools-card">
        <h3 className="section-title">ตัวช่วยจัดการรายงาน</h3>
        
        <div className="tools-grid">
          {/* AI Translation Section */}
          <button 
            className="tool-btn ai-btn" 
            onClick={onCAATTranslate}
            disabled={isLoadingCAAT}
          >
            <Sparkles size={24} className={isLoadingCAAT ? 'spinning' : ''} />
            <div className="tool-text">
              <span className="tool-label">แปลภาษา AI (CAAT-22)</span>
              <span className="tool-desc">{isLoadingCAAT ? 'กำลังประมวลผล...' : 'แปลงเป็นรายงาน กพท.'}</span>
            </div>
          </button>

          {/* Copy Section */}
          <button className="tool-btn" onClick={handleCopyThai}>
            {copiedThai ? <Check size={24} color="#10b981" /> : <Copy size={24} />}
            <div className="tool-text">
              <span className="tool-label">คัดลอกภาษาไทย</span>
              <span className="tool-desc">ส่งเข้ากลุ่ม LINE ทันที</span>
            </div>
          </button>

          {/* View Mode Section */}
          <button 
            className={`tool-btn ${isSplitMode ? 'active' : ''}`} 
            onClick={() => setIsSplitMode(!isSplitMode)}
          >
            <Columns size={24} />
            <div className="tool-text">
              <span className="tool-label">โหมดแบ่งหน้าจอ</span>
              <span className="tool-desc">{isSplitMode ? 'เปิดการแบ่งหน้าจอแล้ว' : 'ดูฟอร์มและพรีวิวพร้อมกัน'}</span>
            </div>
          </button>

          {/* Reset Section */}
          <button className="tool-btn danger-btn" onClick={() => { if(window.confirm('ล้างข้อมูลทั้งหมด?')) onReset(); }}>
            <Trash2 size={24} />
            <div className="tool-text">
              <span className="tool-label">ล้างข้อมูล (Reset)</span>
              <span className="tool-desc">เริ่มต้นรายงานใบใหม่</span>
            </div>
          </button>
        </div>

        <div className="tools-footer-info">
          งานบริการเขตการบิน (Apron Control) ทภก.
        </div>
      </div>
    </div>
  );
};

export default QuickTools;
