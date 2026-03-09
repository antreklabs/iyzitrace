import { injectCSS } from '../../../utils/inject-css';

injectCSS('assets-styles-containers-containers', `
/* Containers Styles */

/* Base Table */
.base-table-wrapper {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--border-light);
}

.base-table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.base-table-title {
    color: var(--text-primary);
    font-weight: 600;
}

.base-table-actions {
    display: flex;
    gap: 8px;
}

/* Service Container */
.service-container {
    padding: 16px;
}

.service-container-header {
    margin-bottom: 24px;
}

/* Service Detail Container */
.service-detail-container {
    padding: 16px;
}

.service-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.service-detail-title {
    color: var(--text-primary);
    font-size: 24px;
    font-weight: 600;
    margin: 0;
}

.service-detail-back {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-muted);
    cursor: pointer;
    transition: color 0.2s;
}

.service-detail-back:hover {
    color: var(--text-primary);
}

/* Trace Container */
.trace-container-wrapper {
    padding: 16px;
}

.trace-container-header {
    margin-bottom: 24px;
}

.trace-container-grid {
    display: grid;
    gap: 16px;
}

/* Exceptions Container */
.exceptions-container {
    padding: 16px;
}

.exceptions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

/* Overview Container */
.overview-container {
    padding: 16px;
}

.overview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.overview-grid {
    display: grid;
    gap: 24px;
}

/* Log Container */
.log-container {
    padding: 16px;
}

.log-container-header {
    margin-bottom: 24px;
}

/* Overview Container */
.overview-main-wrapper {
    padding: 24px;
    min-height: 100vh;
}

.overview-card-wrapper {
    display: inline-block;
}

.overview-card-wrapper-region {
    display: inline-block;
    width: 280px;
}

.overview-card-wrapper-infra {
    display: inline-block;
    width: 300px;
}

.overview-card-wrapper-service {
    display: inline-block;
    min-width: 240px;
}

.overview-icon-blue {
    color: #1890ff;
}

.overview-icon-gray {
    color: var(--text-muted);
}

.overview-icon-white {
    color: var(--text-primary);
}

/* Modal */
.modal-header-with-icon {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-icon-warning {
    color: #faad14;
    font-size: 24px;
}

.modal-body-content {
    padding: 16px 0;
}

.modal-body-title {
    font-size: 16px;
    margin-bottom: 12px;
}

.modal-body-description {
    color: var(--text-muted);
    font-size: 14px;
}`);
