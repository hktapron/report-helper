import React from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';

const PreviewArea = ({
  thaiPreviewRef,
  thaiPreview,
  activeMobileTab,
  reportMode,
  handleSwitchMode,
  isLoadingCAAT,
  onCAATTranslate,
  saveTemplate,
  saveReport,
  selectedTemplate,
  formData,
  extraPreview,
  isSplitMode = false,
  onContextMenu,
}) => {
  const handleSaveTemplate = async () => {
    const n = window.prompt("ชื่อฟอร์มที่จะบันทึก:", selectedTemplate?.name || "");
    if (n) {
      const currentHtml = thaiPreviewRef.current
        ? thaiPreviewRef.current.innerHTML
        : thaiPreview;
      await saveTemplate(n, formData, currentHtml, extraPreview, selectedTemplate?.folder_id);
      alert('บันทึกฟอร์มเรียบร้อย');
    }
  };

  const handleCopyAndSave = () => {
    const text = thaiPreviewRef.current
      ? thaiPreviewRef.current.innerText
      : thaiPreview;
    navigator.clipboard.writeText(text);
    saveReport({
      mode: reportMode,
      templateName: selectedTemplate?.name || 'กำหนดเอง',
      preview: text,
      data: formData,
    });
    alert('คัดลอกและบันทึกแล้ว');
  };

  return (
    <section className={`preview-container-main ${isSplitMode ? 'split-mode-active' : ''}`} style={{ flex: '1', height: '100%', overflow: 'hidden' }}>
      <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Hide header on mobile for unified layout */}
        {window.innerWidth > 768 && (
          <div className="card-header action-bar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="card-title">Preview</h2>
            <div className="action-buttons-group report-action-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-dark btn-save-template"
                onClick={handleSaveTemplate}
                title="บันทึกต้นแบบ"
                style={{ fontWeight: '700', padding: '10px 24px' }}
              >
                บันทึก
              </button>
              <button
                className="btn btn-outline btn-ai-translate"
                onClick={onCAATTranslate}
                disabled={isLoadingCAAT}
                style={{ border: '1px solid #0ea5e9', color: '#0ea5e9', fontWeight: '600', padding: '10px 20px' }}
              >
                {isLoadingCAAT ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>แปลภาษา</span>
              </button>
              <button 
                className="btn btn-primary btn-copy-save" 
                onClick={handleCopyAndSave}
                style={{ background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', border: 'none' }}
              >
                <span>คัดลอกและบันทึก</span>
              </button>
            </div>
          </div>
        )}
        
        <div 
          className="preview-body-v2" 
          style={{ flex: 1, overflowY: 'auto' }}
          onContextMenu={(e) => {
            if (window.innerWidth > 768) {
              onContextMenu(e, 'preview', 'preview', null);
            }
          }}
        >
          <div
            ref={thaiPreviewRef}
            className="preview-textarea"
            contentEditable
            suppressContentEditableWarning
            style={{ whiteSpace: 'pre-wrap', minHeight: '100%' }}
          />
        </div>
      </div>
    </section>
  );
};

export default PreviewArea;
