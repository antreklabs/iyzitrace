import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-components-core-view', `
/* View Component Styles */

.view-dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;
}

.view-dropdown-item-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.view-dropdown-item-right {
    display: flex;
    align-items: center;
    gap: 4px;
}

.view-action-btn-edit {
    color: #1890ff;
    padding: 2px 4px;
}

.view-action-btn-delete {
    color: #ff4d4f;
    padding: 2px 4px;
}

.view-action-btn-save {
    color: #52c41a;
    padding: 2px 4px;
}

.view-action-btn-save:hover {
    color: #389e0d !important;
}

.view-save-item {
    display: flex;
    align-items: center;
    padding: 4px 0;
    color: green;
}

.view-save-icon {
    margin-right: 8px;
    font-size: 14px;
    color: green;
}

.view-clear-item {
    display: flex;
    align-items: center;
    padding: 4px 0;
    color: #ffd700;
}

.view-clear-icon {
    margin-right: 8px;
    font-size: 14px;
    color: #ffd700;
}

.view-dropdown-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.view-dropdown-btn {
    background-color: var(--border-strong);
    border: 1px solid #555;
    color: var(--text-primary);
    border-radius: 6px;
    height: 32px;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 160px;
}

.view-dropdown-btn-text {
    flex: 1;
    text-align: left;
}

/* View Form Utilities */
.view-input-white {
    color: var(--text-primary);
}

.view-text-xs {
    font-size: 11px;
}

.view-mt-6 {
    margin-top: 6px;
}

.view-mt-8 {
    margin-top: 8px;
}

.view-save-label {
    font-weight: 500;
}

/* Grafana Date Picker */
.gf-picker-space {
    width: 100%;
}

.gf-picker-input-dark {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

/* Quick Save Button */
.view-quick-save-wrapper {
    display: flex;
    align-items: center;
}

.view-quick-save-btn {
    color: var(--text-secondary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: transparent !important;
}

.view-quick-save-btn:hover {
    color: #52c41a !important;
    border-color: #52c41a !important;
    background: rgba(82, 196, 26, 0.08) !important;
}

[data-theme="light"] .view-quick-save-btn {
    color: #595959 !important;
    border-color: #d9d9d9 !important;
}

[data-theme="light"] .view-quick-save-btn:hover {
    color: #389e0d !important;
    border-color: #389e0d !important;
    background: rgba(56, 158, 13, 0.06) !important;
}`);
