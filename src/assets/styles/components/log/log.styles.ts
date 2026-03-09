import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-components-log-log', `
/* Log Components Styles */

/* Log Expanded Row */
.log-expanded-row {
    background: var(--bg-primary);
    border-radius: 8px;
    padding: 16px;
}

.log-expanded-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.log-expanded-title {
    color: var(--text-primary);
    font-weight: 500;
}

.log-expanded-content {
    background: var(--bg-primary);
    border-radius: 8px;
    padding: 16px;
    font-family: monospace;
    font-size: 12px;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 400px;
    overflow-y: auto;
}

.log-expanded-section {
    margin-bottom: 16px;
}

.log-expanded-section-title {
    color: var(--text-muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

.log-expanded-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
}

.log-expanded-item {
    display: flex;
    flex-direction: column;
}

.log-expanded-label {
    color: var(--text-muted);
    font-size: 11px;
}

.log-expanded-value {
    color: var(--text-primary);
    font-size: 13px;
    word-break: break-all;
}`);
