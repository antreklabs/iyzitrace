import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-containers-trace-detail-timeline-header', `
/* Timeline Header Styles */

.timeline-header {
    display: flex;
    position: relative;
    height: 24px;
    margin-left: 40%;
    margin-right: 450px;
    border-bottom: 1px solid var(--border-light);
}

.timeline-header-cell {
    flex: 1;
    position: relative;
}

.timeline-header-label {
    text-align: center;
    font-size: 11px;
    color: var(--text-muted);
    position: relative;
    z-index: 1;
}

.timeline-header-gridline {
    position: absolute;
    top: 100%;
    left: 50%;
    width: 1px;
    height: calc(100vh - 24px);
    background-color: var(--bg-tertiary);
}`);
