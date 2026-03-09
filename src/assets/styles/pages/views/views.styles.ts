import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-pages-views-views', `
/* Views Page Styles */

.views-container {
    padding: 24px;
}

.views-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.views-title {
    color: var(--text-primary);
    margin: 0;
}

.views-description {
    color: var(--text-muted);
}

/* View Preview Card */
.view-preview-wrapper {
    margin-top: 12px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: var(--bg-secondary);
    min-height: 180px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.view-preview-error {
    color: var(--text-muted);
    font-size: 12px;
    text-align: center;
    margin: auto 0;
}

.view-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.view-preview-title {
    font-weight: 600;
    font-size: 14px;
}

.view-preview-time {
    font-size: 11px;
}

.view-live-button {
    height: 24px;
    padding: 0 8px;
    font-size: 11px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.view-live-button.active {
    color: #52c41a;
    border-color: #52c41a;
}

.view-live-button.inactive {
    color: var(--text-muted);
    border-color: var(--border-strong);
}

.view-stop-button {
    height: 24px;
    width: 24px;
    padding: 0;
    font-size: 11px;
    color: #ff4d4f;
    border: 1px solid var(--border-strong);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.view-preview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 12px;
}

.view-preview-item {
    background: var(--bg-hover);
    border: 1px solid var(--border-light);
    border-radius: 8px;
    padding: 12px;
}

.view-preview-label {
    font-size: 11px;
    color: var(--text-muted);
    display: block;
    margin-bottom: 4px;
}

.view-preview-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    word-break: break-word;
}

.view-preview-footer {
    margin-top: auto;
    font-size: 11px;
}

/* Views Grid */
.views-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

/* Widget Card */
.view-widget-card {
    margin-bottom: 16px;
}

/* Empty State */
.views-empty-description {
    color: var(--text-secondary);
    font-size: 12px;
    margin-top: 8px;
}

/* Query Row */
.view-query-row {
    margin-top: 6px;
}`);
