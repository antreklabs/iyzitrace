import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-components-service-service', `
/* Service Components Styles */

/* Common Chart Container */
.chart-container {
    width: 100%;
    height: 200px;
    position: relative;
}

.chart-container-lg {
    width: 100%;
    height: 300px;
    position: relative;
}

/* Loading States */
.service-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
}

.service-loading-text {
    margin-left: 8px;
}

/* Service Card Container */
.service-card-wrapper {
    position: relative;
}

.service-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}

.service-card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
}

.service-card-actions {
    display: inline-flex;
    gap: 16px;
}

.service-card-metric-row {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    margin-bottom: 16px;
}

/* Service Detail Card Container */
.service-detail-card {
    background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.service-detail-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.service-metric-label {
    color: #71717a;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.service-metric-value-primary {
    color: #3b82f6;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
}

.service-metric-value-success {
    color: #10b981;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
}

.service-metric-value-warning {
    color: #eab308;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
}

.service-metric-value-error {
    color: #ef4444;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
}

.service-metric-unit {
    color: #52525b;
    font-size: 11px;
    font-weight: 500;
}

.service-metric-icon {
    font-size: 20px;
    opacity: 0.6;
}

.service-metric-icon-primary {
    color: #3b82f6;
}

.service-metric-icon-success {
    color: #10b981;
}

.service-metric-icon-warning {
    color: #eab308;
}

.service-metric-icon-error {
    color: #ef4444;
}

/* Service Detail Chart Container */
.service-chart-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 24px;
}

.service-chart-title {
    font-size: 14px;
    font-weight: 600;
}

/* Container Card */
.service-container-card {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.service-container-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.service-container-name {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    font-size: 13px;
}

.service-container-description {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
}

/* Service Chart Component */
.service-chart-wrapper {
    cursor: pointer;
    transition: all 0.2s;
}

.service-chart-wrapper:hover {
    transform: translateY(-2px);
}

/* Row Margin Bottom */
.row-mb-24 {
    margin-bottom: 24px;
}

/* Service Summary Loading */
.service-summary-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
}

.service-summary-loading-text {
    margin-left: 8px;
}

/* Summary Card Text Styles */
.service-summary-label {
    color: #71717a;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.service-summary-value-blue {
    color: #3b82f6;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
}

.service-summary-value-green {
    color: #10b981;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
}

.service-summary-value-red {
    color: #ef4444;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
}

.service-summary-value-orange {
    color: #f59e0b;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
}

.service-summary-subtext {
    color: #52525b;
    font-size: 11px;
    font-weight: 500;
}

.service-summary-subtext-ellipsis {
    color: #52525b;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.service-summary-icon-blue {
    font-size: 20px;
    color: #3b82f6;
    opacity: 0.6;
}

.service-summary-icon-green {
    font-size: 20px;
    color: #10b981;
    opacity: 0.6;
}

.service-summary-icon-red {
    font-size: 20px;
    color: #ef4444;
    opacity: 0.6;
}

.service-summary-icon-orange {
    font-size: 20px;
    color: #f59e0b;
    opacity: 0.6;
}

/* Chart Card Title */
.service-chart-title-text {
    font-size: 14px;
    font-weight: 600;
}

/* Service Metrics Card */
.service-metrics-card {
    border-radius: 12px;
    margin-bottom: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-light);
    width: 180px;
}

.service-metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 16px;
    row-gap: 8px;
}

.service-metrics-label {
    color: var(--text-muted);
    font-size: 12px;
}

.service-metrics-value {
    color: var(--text-primary);
    font-weight: 600;
}

.service-metrics-view-btn {
    margin-top: 12px;
    width: 100%;
}

/* Service Card Container Scroll */
.service-card-scroll-wrapper {
    position: relative;
}

.service-card-scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    background: var(--bg-secondary);
    border: 1px solid #303030;
    color: #d9d9d9;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
}

.service-card-scroll-btn:hover {
    background: var(--bg-tertiary);
}

.service-card-scroll-btn-left {
    left: 0;
}

.service-card-scroll-btn-right {
    right: 0;
}

.service-card-scroll-area {
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    padding: 0 36px;
}

.service-card-scroll-inner {
    display: inline-flex;
    gap: 16px;
}

/* Chart Card Title Layout */
.service-chart-card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.service-chart-card-duration-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.service-chart-card-empty-actions {
    display: flex;
    gap: 8px;
}

/* Chart Container Wrapper */
.service-chart-container-wrapper {
    position: relative;
    margin-bottom: 24px;
}

.service-chart-row {
    margin-top: 24px;
}

/* Service Detail Chart Container - Gradient Cards */
.service-detail-chart-card-blue {
    height: 380px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%);
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.service-detail-chart-card-green {
    height: 380px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%);
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.service-detail-chart-card-amber {
    height: 380px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%);
    border: 1px solid rgba(245, 158, 11, 0.2);
}

.service-detail-chart-card-purple {
    height: 380px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%);
    border: 1px solid rgba(139, 92, 246, 0.2);
}

/* Service Detail Card Container - Stat Cards */
.service-detail-stat-card-blue {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.service-detail-stat-card-green {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.service-detail-stat-card-red {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.service-detail-stat-card-amber {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Service Detail Chart Sizing */
.service-detail-chart-wrapper {
    width: 100%;
    height: 250px;
    min-height: 250px;
    max-height: 250px;
    overflow: hidden;
    position: relative;
}

.service-detail-chart-inner {
    width: 100% !important;
    height: 250px !important;
    min-height: 250px !important;
    max-height: 250px !important;
}

/* Collector Pipeline Handle Base */
.pipeline-handle {
    z-index: 20;
    width: 14px;
    height: 14px;
    border: 2px solid var(--background);
}

.pipeline-handle-receiver {
    right: -7px;
    background-color: #3b82f6;
}

.pipeline-handle-processor-in {
    left: -7px;
    background-color: #22c55e;
}

.pipeline-handle-processor-out {
    right: -7px;
    background-color: #22c55e;
}

.pipeline-handle-exporter {
    left: -7px;
    background-color: #a855f7;
}`);
