import React from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';

const ReportPreview = ({
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
    <section className={`preview-container-main ${isSplitMode ? 'split-mode-active' : ''}`} style={{ flex: '1' }}>
      <div className="card">
        <div className="card-header action-bar-header">
          <h2 className="card-title">Preview</h2>
          <div className="action-buttons-group">
            <button
              className="btn btn-ghost btn-save-template"
              onClick={handleSaveTemplate}
            >
              บันทึกแม่แบบ
            </button>
            <button
              className="btn btn-primary btn-ai-translate"
              onClick={onCAATTranslate}
              disabled={isLoadingCAAT}
            >
              {isLoadingCAAT ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              แปล AI กพท.22
            </button>
            <button className="btn btn-primary btn-copy-save" onClick={handleCopyAndSave}>
              <Check size={16} /> คัดลอกและบันทึก
            </button>
          </div>
        </div>
        <div className="preview-body-v2">
          <div
            ref={thaiPreviewRef}
            className="preview-textarea"
            contentEditable
            suppressContentEditableWarning
            style={{ whiteSpace: 'pre-wrap', minHeight: '400px' }}
          />
        </div>
      </div>
    </section>
  );
};

export default ReportPreview;
