import { injectCSS } from '../../../../../utils/inject-css';

injectCSS('assets-styles-components-core-layout-layout', `
/* Layout Component Styles */

.main-content {
    padding: 5px;
    transition: margin-left 0.5s, background-color 0.3s ease;
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.menuContent {
    min-width: 50%;
    background: transparent;
    justify-content: flex-start;
    align-items: center;
    border: none;
}

/* Main Layout */
.main-layout {
    min-height: 100vh;
}`);
