import React from 'react';
import { Check, Loader2 } from 'lucide-react';

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
    <section className="preview-container-main" style={{ flex: '1' }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Preview</h2>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost"
              style={{ border: '1px solid var(--border-subtle)', fontSize: '11px' }}
              onClick={handleSaveTemplate}
            >
              บันทึกฟอร์มรายงาน
            </button>
            <button
              className="btn btn-primary"
              title="ทำรายงานด้วย AI"
              style={{ background: 'var(--accent-indigo)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={onCAATTranslate}
              disabled={isLoadingCAAT}
            >
              {isLoadingCAAT && <Loader2 size={16} className="animate-spin" />}
              ทำรายงาน กพท.22
            </button>
            <button className="btn btn-primary" onClick={handleCopyAndSave}>
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
