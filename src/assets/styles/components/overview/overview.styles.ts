import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-components-overview-overview', `
/* Overview Components Styles */

/* Infrastructure Card */
.overview-infra-wrapper {
    position: relative;
    width: 100%;
}

.overview-infra-delete-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 10;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ff4d4f;
    border: none;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
}

.overview-infra-delete-btn:hover {
    background: #ff7875;
    transform: scale(1.1);
}

.overview-infra-card {
    background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid #3a3a3a;
    width: 100%;
    min-width: 280px;
    cursor: pointer;
    transition: all 0.2s;
}

.overview-infra-card:hover {
    border-color: #4a4a4a;
    transform: translateY(-2px);
}

.overview-infra-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.overview-infra-title {
    color: var(--text-primary);
    margin: 0;
}

.overview-infra-subtitle {
    color: rgba(255, 255, 255, 0.8);
}

.overview-infra-status {
    width: 12px;
    height: 12px;
}

.overview-infra-metric-section {
    margin-bottom: 12px;
}

.overview-infra-metric-section-lg {
    margin-bottom: 16px;
}

.overview-infra-metric-label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
}

.overview-infra-progress {
    margin: 4px;
    width: 50%;
}

.overview-infra-metric-value {
    color: var(--text-primary);
    font-size: 12px;
}

.overview-infra-collapse {
    background: transparent;
    border-radius: 12px;
}

/* Service Card */
.overview-service-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.overview-service-title {
    color: var(--text-primary);
    margin: 0;
}

.overview-service-type {
    color: rgba(255, 255, 255, 0.8);
}

.overview-service-metric {
    margin-bottom: 8px;
}

.overview-service-metric-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
}

.overview-service-metric-value {
    color: #10b981;
    font-size: 16px;
    font-weight: 600;
    margin-left: 8px;
}

.overview-service-ops-title {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin-bottom: 8px;
}

.overview-service-ops-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

/* Operation Card */
.overview-operation-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.overview-operation-name {
    color: var(--text-primary);
    font-weight: 500;
}

.overview-operation-metrics {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.overview-operation-metric {
    display: flex;
    flex-direction: column;
}

.overview-operation-metric-label {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
}

.overview-operation-metric-value {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
}

/* Region Card */
.overview-region-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.overview-region-title {
    color: var(--text-primary);
    margin: 0;
}

.overview-region-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
}

.overview-region-stat {
    display: flex;
    flex-direction: column;
}

.overview-region-stat-label {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
}

.overview-region-stat-value {
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
}

/* Applications Sidebar */
.overview-apps-sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.overview-apps-sidebar-title {
    color: var(--text-primary);
    font-weight: 600;
}

.overview-apps-sidebar-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.overview-apps-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.overview-apps-item:hover {
    background: rgba(255, 255, 255, 0.1);
}

.overview-apps-item-name {
    color: var(--text-primary);
    font-weight: 500;
}

.overview-apps-item-count {
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
}

/* ================================
   Service Card — Extended
   ================================ */
.overview-service-card {
    border-radius: 12px;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    height: 100%;
    min-width: 300px;
    width: max-content;
    display: flex;
    flex-direction: column;
    overflow: visible;
    transition: all 0.3s ease;
}

.overview-service-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.overview-service-card-title {
    color: var(--text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.overview-service-expand-btn {
    color: var(--text-primary);
    font-weight: 600;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    height: auto;
    font-size: 12px;
}

.overview-service-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.overview-service-item {
    border: none;
    padding: 6px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    overflow: hidden;
}

.overview-service-item-content {
    width: 100%;
    min-width: 0;
    overflow: hidden;
}

.overview-service-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    gap: 6px;
}

.overview-service-item-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.overview-service-item-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.overview-service-item-name {
    font-weight: 600;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.overview-service-item-type {
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
}

.overview-service-item-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.overview-service-unmap-icon {
    color: rgba(255, 255, 255, 0.6);
    font-size: 16px;
    cursor: pointer;
    transition: color 0.2s;
}

.overview-service-unmap-icon:hover {
    color: #ff4d4f;
}

.overview-service-metrics {
    display: flex;
    gap: 16px;
    padding-left: 44px;
}

.overview-service-metric-subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
    display: block;
}

.overview-service-metric-val {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 13px;
    display: block;
}

.overview-service-icon {
    font-size: 20px;
}

/* ================================
   Operation Card — Extended
   ================================ */
.overview-operation-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid #333;
    background: var(--bg-secondary);
    height: 100%;
    min-width: 300px;
    width: max-content;
    display: flex;
    flex-direction: column;
    overflow: visible;
    transition: all 0.3s ease;
}

.overview-operation-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.overview-operation-card-title {
    margin: 0;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.overview-operation-expand-btn {
    background: var(--bg-tertiary);
    border-color: var(--border-strong);
    color: var(--text-secondary);
    padding: 4px 12px;
    height: auto;
    font-weight: 600;
    font-size: 12px;
}

.overview-operation-expand-btn:hover {
    background: var(--bg-tertiary);
    border-color: #555;
    color: var(--text-primary);
}

.overview-operation-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.overview-operation-item {
    border: none;
    padding: 6px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    overflow: hidden;
}

.overview-operation-item--default {
    background-color: var(--bg-tertiary);
}

.overview-operation-item--default:hover {
    background-color: var(--bg-tertiary);
}

.overview-operation-item--selected {
    background-color: #1890ff;
}

.overview-operation-item-content {
    width: 100%;
    min-width: 0;
    overflow: hidden;
}

.overview-operation-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    gap: 6px;
}

.overview-operation-item-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.overview-operation-item-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.overview-operation-item-name {
    font-weight: 600;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.overview-operation-item-type {
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
}

.overview-operation-avatar {
    background: var(--bg-secondary);
    border: 1px solid var(--border-strong);
    flex-shrink: 0;
}

.overview-operation-metrics {
    display: flex;
    gap: 16px;
    padding-left: 44px;
}

.overview-operation-metric-subtitle {
    font-size: 11px;
    display: block;
    color: var(--text-muted);
}

.overview-operation-metric-val {
    font-weight: 600;
    font-size: 13px;
    display: block;
    color: var(--text-secondary);
}

.overview-operation-icon {
    font-size: 18px;
}

/* ================================
   Infrastructure Card — Extended
   ================================ */
.overview-infra-drop-overlay {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    border: 4px solid #52c41a;
    background: rgba(82, 196, 26, 0.15);
    z-index: 10;
    pointer-events: none;
    animation: pulse 1.5s ease-in-out infinite;
}

.overview-infra-apps-btn {
    width: 100%;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: var(--text-primary);
    font-weight: 600;
}

/* ================================
   Region Card — Extended
   ================================ */
.overview-region-card-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.overview-region-icon {
    font-size: 32px;
}

.overview-region-name {
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 6px;
    letter-spacing: 0.3px;
}

/* ================================
   Applications Sidebar — Extended
   ================================ */
.overview-apps-drawer-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);
}

.overview-apps-drawer-title-icon {
    color: #1890ff;
}

.overview-apps-close-icon {
    color: var(--text-primary);
    font-size: 16px;
}

.overview-apps-platform-icon {
    font-size: 32px;
}

.overview-apps-item-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.overview-apps-item-desc {
    font-size: 12px;
}

/* Icon Color Utilities */
.icon-color-blue {
    color: #1890ff;
}

.icon-color-purple {
    color: #722ed1;
}

.icon-color-green {
    color: #52c41a;
}

.icon-color-orange {
    color: #fa8c16;
}

.icon-color-red {
    color: #f5222d;
}

/* Overview Card — Selected State */
.overview-card-text-selected {
    color: var(--text-primary);
}

.overview-card-text-unselected {
    color: var(--text-primary);
}

.overview-card-subtext-selected {
    color: rgba(255, 255, 255, 0.7);
}

.overview-card-subtext-unselected {
    color: var(--text-muted);
}

.overview-card-metric-subtitle-selected {
    color: rgba(255, 255, 255, 0.6);
}

.overview-card-metric-subtitle-unselected {
    color: var(--text-muted);
}

.overview-card-metric-val-selected {
    color: var(--text-primary);
}

.overview-card-metric-val-unselected {
    color: var(--text-secondary);
}

.overview-card-bg-selected {
    background-color: rgba(255, 255, 255, 0.15);
}

.overview-card-bg-unselected {
    background-color: rgba(255, 255, 255, 0.05);
}

/* Overview Service Card */
.overview-service-avatar {
    background: rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
}

.overview-service-name {
    color: var(--text-primary);
}

.overview-service-subtext {
    color: rgba(255, 255, 255, 0.7);
}

/* Overview Region Utility */
.overview-region-icon {
    flex-shrink: 0;
}

/* Badge flex-shrink */
.badge-no-shrink {
    flex-shrink: 0;
}

/* Scrollable card container */
.overview-scroll-container {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 8px;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: #3a3a3a transparent;
}

/* Scroll nav buttons */
.overview-scroll-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #3a3a3a;
    color: var(--text-primary);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.overview-scroll-nav-left {
    left: -16px;
}

.overview-scroll-nav-right {
    right: -16px;
}

/* Global Utility Classes */
.u-text-white {
    color: var(--text-primary);
}

.u-text-white-fw500 {
    color: var(--text-primary);
    font-weight: 500;
}

.u-text-muted {
    color: var(--text-muted);
}

.u-text-center-muted {
    text-align: center;
    padding: 40px;
    color: var(--text-muted);
}

.u-text-link-blue {
    color: #1890ff;
    text-decoration: underline;
}

.u-mb-16 {
    margin-bottom: 16px;
}

.u-mb-24 {
    margin-bottom: 24px;
}

.u-mt-16 {
    margin-top: 16px;
}

.u-p-0-8 {
    padding: 0 8px;
}

.u-loading-center {
    padding: 40px;
    text-align: center;
}

.u-flex-center-gap16 {
    display: flex;
    align-items: center;
    gap: 16px;
}

/* AI Page — Context Panel */
.ai-context-label {
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.ai-context-text {
    color: #333;
    font-size: 13px;
}

.ai-context-icon-purple {
    color: #667eea;
}

.ai-context-icon-red {
    color: #f5576c;
}

.ai-quick-icon-purple {
    color: #667eea;
}

.ai-quick-icon-red {
    color: #f5576c;
}

.ai-quick-icon-orange {
    color: #ff6b6b;
}

.ai-quick-icon-yellow {
    color: #feca57;
}

/* Config Form Headings */
.config-heading-mb-8 {
    margin-bottom: 8px;
}

.config-heading-m-0 {
    margin: 0;
}

.config-container-padded {
    padding: 0 24px;
}

/* Overview Region Card */
.overview-region-flex1 {
    flex: 1;
}

.overview-region-text-selected {
    color: var(--text-primary);
}

.overview-region-text-unselected {
    color: #000;
}

.overview-region-status-span-selected {
    color: var(--text-primary);
    font-weight: 500;
    font-size: 14px;
}

.overview-region-status-span-unselected {
    color: #000;
    font-weight: 500;
    font-size: 14px;
}

.overview-region-icon-selected {
    color: var(--text-primary);
}

.overview-region-icon-unselected {
    color: #1890ff;
}

/* Infrastructure Node */
.infra-node-type-upper {
    text-transform: uppercase;
}

.infra-handle-hidden {
    opacity: 0;
}

/* Search Tree */
.sm-search-icon {
    color: #9ca3af;
}

.sm-search-result-text {
    color: #e5e7eb;
}

/* Service Chart Container */
.service-chart-height-300 {
    height: 300px;
}

.service-chart-select-80 {
    width: 80px;
}

/* Base Filter */
.filter-select-40pct {
    width: 40%;
}

.filter-input-30pct {
    width: 30%;
}

/* Wizard Layout */
.wizard-layout-container {
    display: flex;
    min-height: 100vh;
    background: var(--bg-primary);
}

.wizard-layout-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: var(--bg-primary);
}

/* FlameGraph Row */
.flamegraph-bar {
    position: absolute;
    top: 0;
    bottom: 0;
}

/* Inventory Manager */
.inv-error-padding {
    padding: 24px;
}

.inv-drawer-padding {
    padding: 32px;
}

.inv-empty-padding {
    padding: 48px;
}

.inv-route-icon {
    font-size: 24px;
}

.inv-sort-icon {
    font-size: 11px;
}

.inv-topology-bg {
    background: var(--bg-primary);
}

/* Agent Manager */
.am-line-num {
    height: 19.5px;
}

.am-font-10 {
    font-size: 10px;
}

.am-tag-xs {
    font-size: 10px;
}

/* Overview Link */
.overview-link-blue {
    color: #1890ff;
    cursor: pointer;
}

/* AI Page */
.ai-model-tag {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: var(--text-primary);
    border: none;
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 500;
}

.ai-chat-input {
    font-size: 15px;
    border-radius: 12px;
    border: 2px solid #e8e8e8;
    padding: 12px 16px;
}

/* Overview Sidebar List Item */
.overview-sidebar-item {
    cursor: pointer;
    padding: 16px 24px;
    transition: all 0.3s ease;
    border-bottom: 1px solid #333;
}

/* Overview Infrastructure Card */
.overview-infra-card-base {
    border-radius: 12px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
}

/* Trace Container Card Bar */
.trace-bar-segment {
    flex: 1;
    opacity: 0.7;
    border-radius: 1px;
    min-height: 3px;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
}

/* Overview Drag Item */
.overview-drag-item {
    cursor: grab;
    transition: opacity 0.2s ease;
}

/* Inventory Tree Transparent */
.inv-tree-transparent {
    background: transparent;
    color: var(--text-primary);
}

/* Overview Card Grid */
.overview-card-grid {
    display: grid;
    grid-template-rows: repeat(2, min-content);
    gap: 8px;
    grid-auto-flow: column;
}

/* ===== Light Mode Overrides ===== */
[data-theme="light"] .overview-infra-card {
    background: #ffffff !important;
    border-color: #e8e8e8 !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .overview-infra-card:hover {
    border-color: #d9d9d9 !important;
}

[data-theme="light"] .overview-infra-subtitle {
    color: #595959;
}

[data-theme="light"] .overview-infra-metric-label {
    color: #1a1a1a;
}

[data-theme="light"] .overview-infra-apps-btn {
    background: rgba(0, 0, 0, 0.04) !important;
    border-color: #d9d9d9 !important;
    color: #1a1a1a !important;
}

[data-theme="light"] .overview-service-card {
    background: #ffffff !important;
    border-color: #e8e8e8 !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .overview-service-type {
    color: #595959;
}

[data-theme="light"] .overview-service-metric-label {
    color: #595959;
}

[data-theme="light"] .overview-service-ops-title {
    color: #1a1a1a;
}

[data-theme="light"] .overview-service-expand-btn {
    background: rgba(0, 0, 0, 0.04) !important;
    border-color: #d9d9d9 !important;
    color: #1a1a1a !important;
}

[data-theme="light"] .overview-service-subtext {
    color: #595959;
}

[data-theme="light"] .overview-service-avatar {
    background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .overview-service-metric-subtitle {
    color: #8c8c8c;
}

[data-theme="light"] .overview-service-unmap-icon {
    color: #8c8c8c;
}

[data-theme="light"] .overview-operation-card {
    border-color: #e8e8e8 !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .overview-operation-metric-label {
    color: #8c8c8c;
}

[data-theme="light"] .overview-operation-metric-value {
    color: #1a1a1a;
}

[data-theme="light"] .overview-card-subtext-selected {
    color: #595959;
}

[data-theme="light"] .overview-card-metric-subtitle-selected {
    color: #8c8c8c;
}

[data-theme="light"] .overview-card-bg-selected {
    background-color: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .overview-card-bg-unselected {
    background-color: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .overview-apps-item {
    background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .overview-apps-item:hover {
    background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .overview-apps-item-count {
    color: #8c8c8c;
}

[data-theme="light"] .overview-region-stat-label {
    color: #8c8c8c;
}

[data-theme="light"] .overview-scroll-container {
    scrollbar-color: #d9d9d9 transparent;
}

[data-theme="light"] .overview-scroll-nav-btn {
    background: rgba(255, 255, 255, 0.9) !important;
    border-color: #d9d9d9 !important;
    color: #1a1a1a !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .overview-sidebar-item {
    border-bottom-color: #e8e8e8;
}

[data-theme="light"] .overview-infra-card-base {
    background: #ffffff !important;
    border-color: #e8e8e8 !important;
}

[data-theme="light"] .sm-search-result-text {
    color: #1a1a1a;
}`);
