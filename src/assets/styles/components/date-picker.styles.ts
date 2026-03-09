import { injectCSS } from '../../../utils/inject-css';

injectCSS('assets-styles-components-date-picker', `
.date-picker-container {
  display: flex;
  width: 400px;
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: 8px;
  color: var(--text-primary);
}
.date-picker-absolute-section {
  width: 200px;
  margin-right: 16px;
}
.date-picker-quick-section {
  width: 150px;
}
.date-picker-section-title {
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.date-picker-field-label {
  color: var(--text-muted);
  margin-bottom: 4px;
}
.date-picker-input {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid #434343;
}
.date-picker-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
.date-picker-date-time-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.date-picker-date-picker {
  flex: 1;
}
.date-picker-date-picker .ant-picker-suffix {
  color: #1890ff !important;
}
.date-picker-time-picker {
  flex: 1;
}
.date-picker-time-picker .ant-picker-suffix {
  color: #1890ff !important;
}
.date-picker-date-picker .ant-picker-suffix .anticon {
  color: #1890ff !important;
  font-size: 14px;
}
.date-picker-time-picker .ant-picker-suffix .anticon {
  color: #1890ff !important;
  font-size: 14px;
}
.date-picker-date-picker .ant-picker-suffix:hover .anticon {
  color: #40a9ff !important;
}
.date-picker-time-picker .ant-picker-suffix:hover .anticon {
  color: #40a9ff !important;
}
.date-picker-apply-button {
  width: 100%;
  margin-top: 8px;
}
.date-picker-divider {
  background: var(--bg-tertiary);
  margin: 16px 0;
}
.date-picker-help-text {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.date-picker-timezone-info {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}
.date-picker-timezone-button {
  margin-left: 8px;
}
.date-picker-search-input {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid #434343;
  margin-bottom: 8px;
}
.date-picker-quick-list {
  background: var(--bg-secondary);
  border-color: #333;
}
.date-picker-quick-item {
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.date-picker-quick-item:hover {
  background-color: var(--bg-tertiary);
}
.date-picker-quick-item.selected {
  background-color: #1890ff;
  color: var(--text-primary);
}`);
