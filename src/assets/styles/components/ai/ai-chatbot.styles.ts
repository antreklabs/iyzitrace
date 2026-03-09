import { injectCSS } from '../../../../utils/inject-css';

injectCSS('assets-styles-components-ai-ai-chatbot', `
/* AI Chatbot Component Styles */

/* Keyframe Animations */
@keyframes chatbot-slide-in {
    from {
        opacity: 0;
        transform: translateX(20px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
}

@keyframes chatbot-float {
    0% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-5px);
    }

    100% {
        transform: translateY(0px);
    }
}

@keyframes chatbot-typing {

    0%,
    100% {
        opacity: 0.3;
        transform: translateY(0);
    }

    50% {
        opacity: 1;
        transform: translateY(-3px);
    }
}

/* Main Wrapper */
.chatbot-wrapper {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Toggle Button */
.chatbot-toggle-button {
    width: 60px;
    height: 60px;
    border-radius: 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    z-index: 1002;
}

.chatbot-toggle-button:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.chatbot-toggle-button::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
    transform: translateX(-100%);
    transition: transform 0.6s;
}

.chatbot-toggle-button:hover::after {
    transform: translateX(100%);
}

.chatbot-toggle-icon {
    font-size: 28px;
    color: var(--text-primary);
    animation: chatbot-float 3s ease-in-out infinite;
}

/* Chat Window */
.chatbot-window {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 380px;
    height: 600px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: chatbot-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: bottom right;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease-in-out;
}

.chatbot-window.fullscreen {
    position: fixed;
    top: 20px;
    right: 20px;
    bottom: 20px;
    left: 20px;
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
    z-index: 1005;
}

/* Header */
.chatbot-header {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10;
    flex-shrink: 0;
}

.chatbot-header-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.chatbot-header-title h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 600;
}

.chatbot-header-title span {
    font-size: 12px;
    opacity: 0.8;
    font-weight: 400;
}

.chatbot-header-actions {
    display: flex;
    gap: 8px;
}

.chatbot-icon-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: var(--text-primary);
    width: 32px;
    height: 32px;
    border-radius: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.chatbot-icon-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.chatbot-close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: var(--text-primary);
    width: 32px;
    height: 32px;
    border-radius: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.chatbot-close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
}

/* Content Area */
.chatbot-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
    position: relative;
    height: 100%;
    overflow: hidden;
}

/* Messages Area */
.chatbot-messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
}

.chatbot-messages-area::-webkit-scrollbar {
    width: 6px;
}

.chatbot-messages-area::-webkit-scrollbar-track {
    background: transparent;
}

.chatbot-messages-area::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
}

.chatbot-messages-area::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
}

/* Message */
.chatbot-message {
    display: flex;
    gap: 12px;
    max-width: 90%;
    animation: chatbot-slide-in 0.3s ease-out;
}

.chatbot-message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
}

.chatbot-message.ai {
    align-self: flex-start;
}

/* Avatar */
.chatbot-avatar {
    width: 32px;
    height: 32px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.chatbot-avatar.ai {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: var(--text-primary);
}

.chatbot-avatar.user {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: var(--text-primary);
}

/* Bubble */
.chatbot-bubble {
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    position: relative;
    word-wrap: break-word;
}

.chatbot-bubble.ai {
    background: white;
    color: #333;
    border-top-left-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.chatbot-bubble.user {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: var(--text-primary);
    border-top-right-radius: 4px;
}

.chatbot-bubble p {
    margin: 0 0 8px 0;
}

.chatbot-bubble p:last-child {
    margin: 0;
}

.chatbot-bubble code {
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
}

.chatbot-bubble pre {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    padding: 10px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
}

/* Suggestions */
.chatbot-suggestions {
    padding: 12px 20px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    background: white;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.chatbot-suggestions::-webkit-scrollbar {
    height: 4px;
}

.chatbot-suggestions::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
}

.chatbot-chip {
    white-space: nowrap;
    padding: 6px 12px;
    border-radius: 20px;
    background: #f0f2f5;
    color: #666;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    gap: 6px;
}

.chatbot-chip:hover {
    background: #e6f7ff;
    color: #1890ff;
    border-color: #91d5ff;
    transform: translateY(-1px);
}

/* Footer */
.chatbot-footer {
    padding: 16px;
    background: white;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.chatbot-input-wrapper {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    background: #f8f9fa;
    padding: 8px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    transition: all 0.2s;
}

.chatbot-input-wrapper:focus-within {
    background: white;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chatbot-input {
    flex: 1;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 8px !important;
    resize: none !important;
    min-height: 24px;
    max-height: 100px;
    color: #333 !important;
}

.chatbot-input:focus {
    outline: none;
}

.chatbot-input::placeholder {
    color: var(--text-muted);
}

.chatbot-send-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.chatbot-send-btn:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.chatbot-send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--border-light);
}

/* Typing Indicator */
.chatbot-typing {
    display: flex;
    gap: 4px;
    padding: 8px;
}

.chatbot-typing span {
    width: 6px;
    height: 6px;
    background: var(--text-muted);
    border-radius: 50%;
    animation: chatbot-typing 1.4s infinite ease-in-out both;
}

.chatbot-typing span:nth-child(1) {
    animation-delay: -0.32s;
}

.chatbot-typing span:nth-child(2) {
    animation-delay: -0.16s;
}

/* Actions */
.chatbot-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
}

.chatbot-action-btn {
    font-size: 11px;
    padding: 4px 10px;
    height: 24px;
    border-radius: 12px;
    background: white;
    border: 1px solid var(--border-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
    color: #666;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.chatbot-action-btn:hover {
    background: #f0f5ff;
    border-color: #adc6ff;
    color: #2f54eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.chatbot-action-btn span {
    font-weight: 500;
}

/* Header Avatar Background */
.chatbot-header-avatar {
    background: rgba(255, 255, 255, 0.2);
}`);
