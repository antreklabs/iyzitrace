import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-pages-ai-ai', `
/* AI Page Styles */

.ai-page-container {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
}

.ai-page-header {
    text-align: center;
    margin-bottom: 32px;
}

.ai-page-title {
    color: var(--text-primary);
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
}

.ai-page-description {
    color: var(--text-muted);
    font-size: 16px;
}

.ai-page-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

@media (max-width: 1024px) {
    .ai-page-content {
        grid-template-columns: 1fr;
    }
}

.ai-page-card {
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid var(--border-light);
}

.ai-page-card-title {
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
}

.ai-page-card-description {
    color: var(--text-muted);
    font-size: 14px;
    margin-bottom: 16px;
}`);
