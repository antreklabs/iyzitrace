import { injectCSS } from '../../../utils/inject-css';

injectCSS('assets-styles-base-base.container', `
.base-container-layout {
  height: calc(100% - 40px);
  overflow: auto;
}

.base-container-content {
  padding: 24px;
}

.base-container-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.base-container {
  padding: 16px;
  background-color: transparent;
}

.base-container-loading-spinner {
  height: 200px;
}

.base-container-icon {
  cursor: pointer;
  margin-right: 8px;
  font-size: 14px;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.base-container-icon:hover {
  color: #1890ff;
}

/* Base Table Styles */
.base-table-container {
  padding: 16px;
}

.base-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.base-table-title {
  margin: 0;
  color: var(--text-primary);
}

.base-table-search {
  max-width: 360px;
}

.base-table-transparent {
  background-color: transparent;
}

.ant-table-thead .ant-table-cell {
  padding-left: 12px;
}

.ant-table-column-sorters {
  gap: 6px;
}

.ant-table-filter-trigger {
  margin-left: 8px;
  margin-right: 8px;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.ant-table-column-title {
  padding-left: 8px;
  padding-right: 8px;
}

td.numeric-cell {
  text-align: right !important;
  font-weight: 600;
}

th.column-hidden,
td.column-hidden {
  display: none !important;
}

td.nowrap-cell,
th.nowrap-cell {
  white-space: nowrap;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  border: 1px solid transparent;
}

.status-tag.healthy {
  color: #22d39a;
  border-color: #22d39a33;
  background: #0d2d2a;
}

.status-tag.warning {
  color: #f3b03b;
  border-color: #f3b03b33;
  background: #2b2513;
}

.status-tag.error {
  color: #ff4d4f;
  border-color: #ff4d4f33;
  background: #2a1517;
}

.pct-pill {
  position: relative;
  height: 14px;
  border-radius: 7px;
  background: #1e2b31;
  min-width: 72px;
}

.pct-pill-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #12a36a;
  border-radius: 7px;
}

.pct-pill-label {
  position: relative;
  z-index: 1;
  display: inline-block;
  width: 100%;
  text-align: center;
  font-size: 11px;
  line-height: 14px;
  color: #cfe9df;
  font-weight: 600;
}

img.img-thumb {
  width: 64px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #ffffff;
}

.base-table-container {
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border-strong);
}

.ant-pagination {
  margin-top: 16px !important;
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
}

.ant-pagination-total-text {
  color: var(--text-primary) !important;
  font-size: 14px;
}

.ant-pagination-item {
  background-color: var(--bg-tertiary) !important;
  border: 1px solid var(--border-strong) !important;
  color: var(--text-primary) !important;
  margin: 0 4px !important;
}

.ant-pagination-item:hover {
  background-color: var(--bg-hover) !important;
  border-color: var(--border-strong) !important;
}

.ant-pagination-item-active {
  background-color: #ff6b35 !important;
  border-color: #ff6b35 !important;
  color: #ffffff !important;
}

.ant-pagination-prev,
.ant-pagination-next {
  background-color: var(--bg-tertiary) !important;
  border: 1px solid var(--border-strong) !important;
  color: var(--text-primary) !important;
  margin: 0 4px !important;
}

.ant-pagination-prev:hover,
.ant-pagination-next:hover {
  background-color: var(--bg-hover) !important;
  border-color: var(--border-strong) !important;
}

.ant-pagination-options {
  color: var(--text-primary) !important;
  margin-left: 8px !important;
}

.ant-pagination-options .ant-select-selector {
  background-color: var(--bg-tertiary) !important;
  border: 1px solid var(--border-strong) !important;
  color: var(--text-primary) !important;
}

.ant-pagination-options .ant-select-arrow {
  color: var(--text-primary) !important;
}`);
