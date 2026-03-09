import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-components-settings-settings', `
/* Settings Page Styles */

/* Tab Bar */
.settings-tab-bar {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 16px;
    padding-bottom: 4px;
    overflow-x: auto;
}

.settings-tab-btn {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-light);
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
}

.settings-tab-btn.active {
    background: var(--bg-tertiary);
    border-bottom-color: #34d399;
}

/* Settings Section */
.settings-section {
    margin-bottom: 16px;
    padding: 16px;
    border-radius: 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
}

.settings-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.settings-section-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.settings-section-content-lg {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.settings-description {
    color: var(--text-muted);
}

.settings-description-mt {
    color: var(--text-muted);
    margin-top: 6px;
}

/* Settings Icons */
.settings-icon-green {
    color: #34d399;
}

.settings-icon-blue {
    color: #60a5fa;
}

.settings-icon-orange {
    color: #f59e0b;
}

.settings-icon-purple {
    color: #a78bfa;
}

/* Placeholder Section */
.settings-placeholder-wrapper {
    padding: 16px 4px;
}

.settings-placeholder-content {
    padding: 16px;
    border: 1px dashed var(--border-color);
    border-radius: 8px;
    color: var(--text-muted);
    margin-bottom: 16px;
}

.settings-placeholder-info {
    font-size: 13px;
    color: var(--text-muted);
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 18px 20px;
    margin-top: 8px;
    line-height: 1.7;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.settings-placeholder-intro {
    margin: 8px 0 12px 0;
    color: var(--text-muted);
    font-size: 13px;
}

.settings-link-list {
    margin: 0 0 0 18px;
    padding: 0;
    list-style: disc;
}

.settings-link-item {
    margin-bottom: 8px;
}

.settings-link-item:last-child {
    margin-bottom: 0;
}

.settings-link {
    color: #34d399;
    font-weight: 500;
}

.settings-link-description {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 2px;
}

/* Field Row */
.settings-field-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Save Button Container */
.settings-save-container {
    position: sticky;
    bottom: 0;
    padding-top: 8px;
    padding-bottom: 8px;
    background: var(--bg-primary);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: flex-end;
}

/* Settings Page Header */
.settings-page {
    background: var(--bg-primary);
    min-height: 100vh;
}

.settings-header {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-light);
    position: sticky;
    top: 0;
    z-index: 50;
    margin-bottom: 16px;
}

.settings-header__inner {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
}

.settings-header__title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
}

.settings-header__title-icon {
    font-size: 24px;
}

.settings-header__nav {
    display: flex;
    align-items: center;
    gap: 4px;
}

.settings-header__tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}

.settings-header__tab--active {
    background: #3b82f6;
    color: var(--text-primary);
}

.settings-header__tab--inactive {
    background: transparent;
    color: var(--text-muted);
}

.settings-header__tab--inactive:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

.settings-description-sm {
    margin-bottom: 8px;
    color: var(--text-muted);
}

/* Definitions Table */
.definitions-table-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.definitions-table-header {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 12px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
    margin-bottom: 8px;
}

.definitions-table-header-mt {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 12px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
    margin-top: 16px;
    margin-bottom: 8px;
}

.definitions-table-heading {
    font-weight: 600;
    color: var(--text-primary);
}

.definitions-table-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* ========================================
   Platform Tab Styles
   ======================================== */

.settings-platform-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.settings-platform-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    color: var(--text-primary);
}

.settings-platform-input {
    width: 100%;
    max-width: 500px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 14px;
    transition: border-color 0.2s;
}

.settings-platform-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.settings-platform-input::placeholder {
    color: var(--text-muted);
}

/* Auth type toggle */
.settings-auth-toggle {
    display: flex;
    gap: 12px;
    max-width: 500px;
}

.settings-auth-toggle-option {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 2px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.settings-auth-toggle-option:hover {
    border-color: var(--border-strong);
    background: var(--bg-secondary);
}

.settings-auth-toggle-option.active {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.08);
}

.settings-auth-toggle-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.settings-auth-toggle-text strong {
    font-size: 14px;
}

.settings-auth-toggle-text span {
    font-size: 12px;
    color: var(--text-muted);
}

.settings-field-animated {
    animation: settings-slideDown 0.3s ease-out;
}

@keyframes settings-slideDown {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Verify section */
.settings-verify-section {
    padding-top: 16px;
    border-top: 1px solid var(--border-light);
}

.settings-verify-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--text-primary);
}

.settings-verify-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 12px;
    flex-wrap: wrap;
}

.settings-verify-result {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
}

.settings-verify-result.success {
    color: #22c55e;
}

.settings-verify-result.error {
    color: #ef4444;
}

.settings-alert-mt {
    margin-top: 16px;
}

/* ========================================
   Data Sources Tab Styles
   ======================================== */

.settings-datasource-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.settings-datasource-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    transition: background 0.2s;
}

.settings-datasource-item:hover {
    background: var(--bg-secondary);
}

.settings-datasource-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.settings-datasource-info strong {
    font-size: 14px;
    color: var(--text-primary);
}

.settings-datasource-url {
    font-size: 12px;
    color: var(--text-muted);
    font-family: monospace;
}

.settings-datasource-status {
    display: flex;
    align-items: center;
    font-size: 18px;
}

.settings-icon-spin {
    color: #3b82f6;
    animation: spin 1s linear infinite;
}

.settings-icon-check {
    color: #22c55e;
}

.settings-icon-error {
    color: #ef4444;
}

.settings-status-dash {
    color: var(--text-muted);
    font-size: 16px;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.settings-datasource-actions {
    margin-top: 16px;
}

/* ========================================
   Grafana Alert Overrides for readability
   ======================================== */

/* Success alert */
.settings-page [data-testid="data-testid Alert success"] {
    background: rgba(34, 197, 94, 0.15) !important;
    border: 1px solid rgba(34, 197, 94, 0.4) !important;
}

.settings-page [data-testid="data-testid Alert success"],
.settings-page [data-testid="data-testid Alert success"] * {
    color: #4ade80 !important;
}

.settings-page [data-testid="data-testid Alert success"] svg {
    fill: #4ade80 !important;
}

/* Warning alert */
.settings-page [data-testid="data-testid Alert warning"] {
    background: rgba(245, 158, 11, 0.15) !important;
    border: 1px solid rgba(245, 158, 11, 0.4) !important;
}

.settings-page [data-testid="data-testid Alert warning"],
.settings-page [data-testid="data-testid Alert warning"] * {
    color: #fbbf24 !important;
}

.settings-page [data-testid="data-testid Alert warning"] svg {
    fill: #fbbf24 !important;
}

/* Disabled button — softer but still legible */
.settings-page button:disabled {
    opacity: 0.65;
}`);
