import React from 'react';
import { Pin } from 'lucide-react';

const getSmartTitle = (h) => h.customTitle || h.templateName || 'รายงานเหตุการณ์';

const HistoryList = ({ filteredHistory, onSelectTemplate, onContextMenu, activeMobileTab }) => {
  return (
    <div className={`history-section-wrapper ${activeMobileTab === 'templates' ? 'mobile-hidden' : ''}`}>
      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1rem 0.5rem' }} />
      <div className="history-section" style={{ border: 'none', paddingTop: 0, paddingBottom: '2rem' }}>
        <div className="history-title">ประวัติเหตุการณ์</div>
        {filteredHistory.filter(h => h.isPinned).map(h => (
          <div
            key={h.id}
            className="history-item"
            style={{ borderLeft: '2px solid var(--accent-indigo)' }}
            onClick={() => onSelectTemplate(h, 'history')}
            onContextMenu={(e) => onContextMenu(e, 'history', h.id, h)}
          >
            <div className="history-info">
              <span style={{ flex: 1, fontWeight: 'bold' }}>{getSmartTitle(h)}</span>
              <Pin size={12} fill="var(--accent-indigo)" />
            </div>
          </div>
        ))}
        {filteredHistory.filter(h => !h.isPinned).slice(0, 20).map(h => (
          <div
            key={h.id}
            className="history-item"
            onClick={() => onSelectTemplate(h, 'history')}
            onContextMenu={(e) => onContextMenu(e, 'history', h.id, h)}
          >
            <div className="history-info">
              <span style={{ flex: 1 }}>{getSmartTitle(h)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
