import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-pages-teams-teams', `
/* Teams Pages Styles */

/* Teams Page Container */
.teams-page-container {
    padding: 24px;
    background: var(--bg-primary);
    min-height: 100vh;
}

.teams-page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.teams-page-header-left {
    flex: 1;
}

.teams-page-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
}

.teams-page-description {
    font-size: 14px;
    color: var(--text-muted);
    margin: 0;
}

.teams-create-button {
    background: #7c3aed;
    border-color: #7c3aed;
}

.teams-create-button:hover {
    background: #6d28d9;
    border-color: #6d28d9;
}

.teams-search-bar {
    margin-bottom: 24px;
}

.teams-search-bar .ant-input {
    background: var(--bg-secondary);
    border-color: var(--border-strong);
    color: var(--text-primary);
}

.teams-search-bar .ant-input:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.teams-table-card .ant-table {
    background: var(--bg-secondary);
    border-radius: 8px;
}

.teams-table-card .ant-table-thead>tr>th {
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-strong);
    color: var(--text-primary);
    font-weight: 600;
}

.teams-table-card .ant-table-tbody>tr>td {
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-strong);
    color: var(--text-primary);
}

.teams-table-card .ant-table-tbody>tr:hover>td {
    background: var(--bg-tertiary);
}

.team-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-right: 12px;
}

.team-name {
    font-weight: 500;
    color: var(--text-primary);
}

.team-manage-button {
    background: transparent;
    border: 1px solid var(--border-strong);
    color: var(--text-primary);
}

.team-manage-button:hover {
    background: var(--bg-tertiary);
    border-color: #7c3aed;
    color: #7c3aed;
}

.teams-modal .ant-modal-content {
    background: var(--bg-secondary);
    border-radius: 8px;
}

.teams-modal .ant-modal-header {
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-strong);
}

.teams-modal .ant-modal-title {
    color: var(--text-primary);
}

.teams-modal .ant-modal-body {
    background: var(--bg-secondary);
}

.teams-modal .ant-form-item-label>label {
    color: var(--text-primary);
}

.teams-modal .ant-input {
    background: var(--bg-tertiary);
    border-color: var(--border-strong);
    color: var(--text-primary);
}

.teams-modal .ant-input:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.team-icon-preview {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-right: 16px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
}

.team-randomize-button {
    background: var(--bg-tertiary);
    border-color: var(--border-strong);
    color: var(--text-primary);
}

.team-randomize-button:hover {
    background: var(--border-strong);
    border-color: #7c3aed;
    color: #7c3aed;
}

/* Team Card */
.team-cell {
    display: flex;
    align-items: center;
}

.team-members-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.team-member-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

.team-member-name {
    font-size: 12px;
    color: var(--text-muted);
}

.teams-empty-state {
    text-align: center;
    padding: 40px;
    color: var(--text-muted);
}

.teams-pagination-wrapper {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

.teams-form-icon-wrapper {
    display: flex;
    align-items: center;
}

.teams-form-actions {
    text-align: right;
    margin-top: 24px;
}

/* Badge Override */
.team-badge-purple {
    background-color: #7c3aed;
}

/* Teams Manage Page Styles */
.teams-manage-container {
    padding: 24px;
    background: var(--bg-primary);
    min-height: 100vh;
}

.teams-manage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.teams-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-muted);
    font-size: 14px;
}

.teams-breadcrumb .breadcrumb-link {
    color: #7c3aed;
    cursor: pointer;
}

.teams-breadcrumb .breadcrumb-link:hover {
    color: #a855f7;
}

.teams-manage-team-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.teams-manage-team-icon {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
}

.teams-manage-team-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.teams-manage-header-actions {
    display: flex;
    gap: 12px;
}

.teams-add-button {
    background: #7c3aed;
    border-color: #7c3aed;
}

.teams-add-button:hover {
    background: #6d28d9;
    border-color: #6d28d9;
}

.teams-leave-button {
    background: var(--bg-tertiary);
    border-color: var(--border-strong);
    color: var(--text-primary);
}

.teams-leave-button:hover {
    background: var(--border-strong);
    border-color: #dc2626;
    color: #dc2626;
}

.teams-tabs-card .ant-tabs-nav {
    background: var(--bg-secondary);
    border-radius: 8px 8px 0 0;
    margin: 0;
}

.teams-tabs-card .ant-tabs-tab {
    color: var(--text-muted);
}

.teams-tabs-card .ant-tabs-tab.ant-tabs-tab-active {
    color: #7c3aed;
}

.teams-tabs-card .ant-tabs-ink-bar {
    background: #7c3aed;
}

.teams-tabs-card .ant-tabs-content-holder {
    background: var(--bg-secondary);
    border-radius: 0 0 8px 8px;
    padding: 24px;
}

.teams-manage-search-bar {
    margin-bottom: 24px;
}

.teams-manage-search-bar .ant-input {
    background: var(--bg-tertiary);
    border-color: var(--border-strong);
    color: var(--text-primary);
}

.teams-manage-search-bar .ant-input:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.teams-manage-table .ant-table {
    background: var(--bg-tertiary);
    border-radius: 8px;
}

.teams-manage-table .ant-table-thead>tr>th {
    background: var(--border-strong);
    border-bottom: 1px solid var(--border-strong);
    color: var(--text-primary);
    font-weight: 600;
}

.teams-manage-table .ant-table-tbody>tr>td {
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-strong);
    color: var(--text-primary);
}

.teams-manage-table .ant-table-tbody>tr:hover>td {
    background: var(--border-strong);
}

.teams-member-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.teams-member-name {
    font-weight: 500;
    color: var(--text-primary);
}

.teams-member-email {
    font-size: 12px;
    color: var(--text-muted);
}

.teams-remove-button {
    background: transparent;
    border: 1px solid var(--border-strong);
    color: #dc2626;
}

.teams-remove-button:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: var(--text-primary);
}

/* Page Item */
.teams-page-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.teams-page-item-icon {
    font-size: 20px;
}

.teams-page-item-name {
    font-weight: 500;
    color: var(--text-primary);
}

.teams-page-item-description {
    font-size: 12px;
    color: var(--text-muted);
}

.teams-page-item-route {
    color: var(--text-muted);
    font-family: monospace;
}

.teams-page-item-date {
    color: var(--text-muted);
}

/* Available Page Item */
.teams-available-page-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-strong);
}

.teams-available-page-icon {
    font-size: 20px;
    margin-left: 12px;
    margin-right: 12px;
}

.teams-available-page-content {
    flex: 1;
}

.teams-available-page-name {
    color: var(--text-primary);
    font-weight: 500;
}

.teams-available-page-description {
    color: var(--text-muted);
    font-size: 12px;
}

.teams-available-page-route {
    color: var(--text-muted);
    font-size: 11px;
    font-family: monospace;
}

.teams-pages-list {
    max-height: 400px;
    overflow-y: auto;
}

.teams-add-actions-wrapper {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-end;
}`);
