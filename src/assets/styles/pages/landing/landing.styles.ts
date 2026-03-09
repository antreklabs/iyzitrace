import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-pages-landing-landing', `
/* Landing Page Styles */

.landing-container {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
}

/* === Header (welcome section) === */
.landing-header {
    margin-bottom: 32px;
}

.landing-welcome-text {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
}

.landing-description {
    color: var(--text-muted);
    margin-bottom: 16px;
    font-size: 14px;
    line-height: 1.6;
}

.landing-description strong {
    color: var(--text-primary);
}

.landing-workspace-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.landing-status-summary {
    display: flex;
    align-items: baseline;
    gap: 2px;
}

.landing-status-active {
    font-size: 28px;
    font-weight: 700;
    color: #52c41a;
}

.landing-status-label {
    font-size: 16px;
    color: var(--text-muted);
    font-weight: 500;
}

/* === Dismiss button === */
.landing-dismiss-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid var(--border-strong);
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.landing-dismiss-btn:hover {
    border-color: var(--text-secondary);
    color: var(--text-primary);
    background: var(--bg-hover);
}

/* === Collapsed toolbar (shown after dismiss) === */
.landing-collapsed-toolbar {
    margin-bottom: 16px;
}

.landing-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-strong);
    background: var(--bg-hover);
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.landing-toggle-btn:hover {
    border-color: var(--text-secondary);
    background: var(--bg-active);
}

.landing-toggle-label {
    font-weight: 600;
}

.landing-toggle-count {
    color: #52c41a;
    font-size: 13px;
    font-weight: 500;
    margin-left: 4px;
}

/* === Cards grid === */
.landing-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
    transition: all 0.3s ease;
}

.landing-cards-grid-collapsed {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
}

@media (max-width: 768px) {

    .landing-cards-grid,
    .landing-cards-grid-collapsed {
        grid-template-columns: 1fr;
    }
}

/* === Card === */
.landing-menu-card {
    padding: 20px;
    transition: all 0.2s ease;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
}

.landing-menu-card-collapsed {
    padding: 12px 16px;
    gap: 0;
}

.landing-card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.landing-menu-card-collapsed .landing-card-row {
    margin-bottom: 0;
}

.landing-card-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.landing-menu-card-collapsed .landing-card-left {
    gap: 8px;
}

.landing-card-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.landing-card-title {
    font-size: 16px;
    font-weight: 600;
}

.landing-menu-card-collapsed .landing-card-title {
    font-size: 14px;
}

.landing-card-description {
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.4;
}

.landing-card-icon {
    font-size: 20px;
    color: var(--text-muted);
}

.landing-menu-card-collapsed .landing-card-icon {
    font-size: 16px;
}

/* === Views section (embedded below cards) === */
.landing-views-section {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--border-color);
}

.landing-views-header {
    margin-bottom: 16px;
}

.landing-views-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px 0;
}

.landing-views-subtitle {
    font-size: 13px;
    color: var(--text-muted);
}

/* ===== Light mode overrides for Grafana UI Cards ===== */
[data-theme="light"] .landing-menu-card {
    background-color: #ffffff !important;
    border-color: #e8e8e8 !important;
    color: #1a1a1a !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
}

[data-theme="light"] .landing-menu-card * {
    color: inherit;
}

[data-theme="light"] .landing-card-title {
    color: #1a1a1a !important;
}

[data-theme="light"] .landing-card-description {
    color: #595959 !important;
}

[data-theme="light"] .landing-card-icon {
    color: #595959 !important;
}

[data-theme="light"] .landing-toggle-btn {
    background: #ffffff !important;
    color: #1a1a1a !important;
    border-color: #d9d9d9 !important;
}

[data-theme="light"] .landing-toggle-btn:hover {
    background: #f5f5f5 !important;
}

[data-theme="light"] .landing-welcome-text {
    color: #1a1a1a;
}

[data-theme="light"] .landing-dismiss-btn {
    color: #595959;
    border-color: #d9d9d9;
}

[data-theme="light"] .landing-dismiss-btn:hover {
    color: #1a1a1a;
    border-color: #bfbfbf;
    background: #f5f5f5;
}`);
