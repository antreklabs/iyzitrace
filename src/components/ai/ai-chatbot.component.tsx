import React, { useState, useEffect, useRef } from 'react';
import { Input, Avatar, Tooltip, message, Badge } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  CloseOutlined,
  ThunderboltOutlined,
  BugOutlined,
  BarChartOutlined,
  CopyOutlined,
  LoadingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import { css, keyframes } from '@emotion/css';
import { getBackendSrv } from '@grafana/runtime';
import {
  initAI,
  askAI,
  type AIResponse,
} from '../../api/service/ai.service';
import type { PluginJsonData } from '../../interfaces/utils/options';

const PLUGIN_ID = 'iyzitrace-app';

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px) scale(0.95); }
  to { opacity: 1; transform: translateX(0) scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const typing = keyframes`
  0%, 100% { opacity: 0.3; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
`;

const styles = {
  chatbotWrapper: css`
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `,

  toggleButton: css`
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

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
      transform: translateX(-100%);
      transition: transform 0.6s;
    }

    &:hover::after {
      transform: translateX(100%);
    }
  `,

  toggleIcon: css`
    font-size: 28px;
    color: white;
    animation: ${float} 3s ease-in-out infinite;
  `,

  window: css`
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 380px;
    height: 600px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 
      0 20px 50px rgba(0,0,0,0.1),
      0 0 0 1px rgba(255,255,255,0.5) inset;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: ${slideIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: bottom right;
    border: 1px solid rgba(255,255,255,0.2);
    transition: all 0.3s ease-in-out;

    &.fullscreen {
      position: fixed;
      top: 20px;
      right: 20px;
      bottom: 20px;
      left: 20px;
      width: calc(100vw - 40px);
      height: calc(100vh - 40px);
      z-index: 1005;
    }
  `,

  header: css`
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    position: relative;
    z-index: 10;
    flex-shrink: 0;
  `,

  headerTitle: css`
    display: flex;
    align-items: center;
    gap: 12px;
    
    h3 {
      margin: 0;
      color: white;
      font-size: 16px;
      font-weight: 600;
    }

    span {
      font-size: 12px;
      opacity: 0.8;
      font-weight: 400;
    }
  `,

  headerActions: css`
    display: flex;
    gap: 8px;
  `,

  iconBtn: css`
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: rgba(255,255,255,0.3);
      transform: scale(1.1);
    }
  `,

  closeBtn: css`
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: rgba(255,255,255,0.3);
      transform: rotate(90deg);
    }
  `,

  content: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
    position: relative;
    height: 100%;
    overflow: hidden;
  `,

  messagesArea: css`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.1);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: rgba(0,0,0,0.2);
    }
  `,

  message: css`
    display: flex;
    gap: 12px;
    max-width: 90%;
    animation: ${slideIn} 0.3s ease-out;
    
    &.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    
    &.ai {
      align-self: flex-start;
    }
  `,

  avatar: css`
    width: 32px;
    height: 32px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);

    &.ai {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    &.user {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
  `,

  bubble: css`
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    position: relative;
    word-wrap: break-word;

    &.ai {
      background: white;
      color: #333;
      border-top-left-radius: 4px;
      border: 1px solid rgba(0,0,0,0.05);
    }

    &.user {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-top-right-radius: 4px;
    }

    p { margin: 0 0 8px 0; }
    p:last-child { margin: 0; }
    
    code {
      background: rgba(0,0,0,0.1);
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
    }
    
    pre {
      background: #2d2d2d;
      color: #ccc;
      padding: 10px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 8px 0;
    }
  `,

  suggestions: css`
    padding: 12px 20px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    background: white;
    border-top: 1px solid rgba(0,0,0,0.05);

    &::-webkit-scrollbar {
      height: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.1);
      border-radius: 2px;
    }
  `,

  chip: css`
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

    &:hover {
      background: #e6f7ff;
      color: #1890ff;
      border-color: #91d5ff;
      transform: translateY(-1px);
    }
  `,

  footer: css`
    padding: 16px;
    background: white;
    border-top: 1px solid rgba(0,0,0,0.05);
  `,

  inputWrapper: css`
    display: flex;
    gap: 10px;
    align-items: flex-end;
    background: #f8f9fa;
    padding: 8px;
    border-radius: 12px;
    border: 1px solid #e8e8e8;
    transition: all 0.2s;

    &:focus-within {
      background: white;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  `,

  input: css`
    flex: 1;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 8px !important;
    resize: none !important;
    min-height: 24px;
    max-height: 100px;
    color: #333 !important;
    
    &:focus {
      outline: none;
    }

    &::placeholder {
      color: #999;
    }
  `,

  sendBtn: css`
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #ccc;
    }
  `,

  typing: css`
    display: flex;
    gap: 4px;
    padding: 8px;
    
    span {
      width: 6px;
      height: 6px;
      background: #999;
      border-radius: 50%;
      animation: ${typing} 1.4s infinite ease-in-out both;
      
      &:nth-child(1) { animation-delay: -0.32s; }
      &:nth-child(2) { animation-delay: -0.16s; }
    }
  `,
  
  actions: css`
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  `,
  
  actionBtn: css`
    font-size: 11px;
    padding: 4px 10px;
    height: 24px;
    border-radius: 12px;
    background: white;
    border: 1px solid #e8e8e8;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
    color: #666;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    
    &:hover {
      background: #f0f5ff;
      border-color: #adc6ff;
      color: #2f54eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.05);
    }

    span {
      font-weight: 500;
    }
  `
};

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface AIChatbotProps {
  contextData?: any;
  contextTitle?: string;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ contextData, contextTitle = 'Current View' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setFullscreen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showBadge, setShowBadge] = useState(true);

  useEffect(() => {
    const initializeAI = async () => {
      try {
        const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
        const aiConfig = (settings?.jsonData as PluginJsonData)?.aiConfig;
        
        initAI({
          apiKey: aiConfig?.apiKey || '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',
          model: aiConfig?.model || 'deepseek/deepseek-chat',
          baseUrl: 'https://openrouter.ai/api/v1',
          temperature: aiConfig?.temperature ?? 0.7,
          maxTokens: aiConfig?.maxTokens ?? 300,
        });
        
        setInitialized(true);
      } catch (error) {
      }
    };
    initializeAI();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && initialized) {
      setShowBadge(false);
    }
  }, [isOpen, initialized]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !initialized) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response: AIResponse = await askAI({
        prompt: text,
        context: {
          customData: {
            currentView: contextTitle,
            data: contextData
          }
        }
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      let errorMessage = '❌ Sorry, something went wrong.';
      
      if (error.code === 'TOKEN_LIMIT_EXCEEDED') {
        errorMessage = `⚠️ **Too Much Data**\n\nYour question includes too much context data. Please try:\n\n1. Being more specific in your question\n2. Focusing on a specific region or service\n3. Asking about a smaller time range\n\n*Technical: ${error.details?.estimated || 'Unknown'} tokens estimated, limit is ${error.details?.limit || 'Unknown'}*`;
      } else if (error.code === 'TIMEOUT') {
        errorMessage = '⏱️ **Request Timeout**\n\nThe request took too long. Please try again with a simpler question.';
      } else if (error.code === 'CANCELLED') {
        errorMessage = '🚫 **Request Cancelled**\n\nYour previous request was cancelled.';
      } else if (error.code === 'NOT_INITIALIZED') {
        errorMessage = '⚙️ **AI Not Configured**\n\nPlease configure your OpenRouter API key in plugin settings.';
      } else if (error.message) {
        errorMessage = `❌ **Error**\n\n${error.message}`;
      }
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: errorMessage,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatContent = (content: string) => {
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied!');
  };

  return (
    <div className={styles.chatbotWrapper}>
      {isOpen && (
        <div className={`${styles.window} ${isFullscreen ? 'fullscreen' : ''}`}>
          {
}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <Avatar icon={<RobotOutlined />} style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <h3>AI Assistant</h3>
                <span>{initialized ? 'Online' : 'Connecting...'}</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.iconBtn} onClick={() => setFullscreen(!isFullscreen)}>
                {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              </button>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                <CloseOutlined />
              </button>
            </div>
          </div>

          {
}
          <div className={styles.content}>
            <div className={styles.messagesArea}>
              {messages.map(msg => (
                <div key={msg.id} className={`${styles.message} ${msg.role}`}>
                  <div className={`${styles.avatar} ${msg.role}`}>
                    {msg.role === 'ai' ? <RobotOutlined /> : '👤'}
                  </div>
                  <div>
                    <div className={`${styles.bubble} ${msg.role}`}>
                      {formatContent(msg.content)}
                    </div>
                    {msg.role === 'ai' && !msg.isError && (
                      <>
                        <div className={styles.actions}>
                          <button className={styles.actionBtn} onClick={() => copyToClipboard(msg.content)}>
                            <CopyOutlined /> Copy
                          </button>
                          <button className={styles.actionBtn} onClick={() => sendMessage('Tell me more')}>
                            <ThunderboltOutlined /> Tell me more
                          </button>
                          <button className={styles.actionBtn} onClick={() => sendMessage('Any other issues?')}>
                            <BugOutlined /> Find more issues
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className={`${styles.message} ai`}>
                  <div className={`${styles.avatar} ai`}>
                    <LoadingOutlined />
                  </div>
                  <div className={`${styles.bubble} ai`}>
                    <div className={styles.typing}>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {
}
            {!loading && messages.length < 3 && (
              <div className={styles.suggestions}>
                <button className={styles.chip} onClick={() => sendMessage('Analyze this data for anomalies')}>
                  <BugOutlined /> Find Anomalies
                </button>
                <button className={styles.chip} onClick={() => sendMessage('Summarize performance metrics')}>
                  <BarChartOutlined /> Summarize Performance
                </button>
                <button className={styles.chip} onClick={() => sendMessage('Give me optimization tips')}>
                  <ThunderboltOutlined /> Optimization Tips
                </button>
              </div>
            )}

            {
}
            <div className={styles.footer}>
              <div className={styles.inputWrapper}>
                <Input.TextArea
                  className={styles.input}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AI..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={loading || !initialized}
                />
                <button 
                  className={styles.sendBtn} 
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading || !initialized}
                >
                  <SendOutlined />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {
}
      <Tooltip title="AI Assistant" placement="left">
        <Badge count={showBadge ? 1 : 0} dot>
          <button 
            className={styles.toggleButton} 
            onClick={() => setIsOpen(!isOpen)}
          >
            <RobotOutlined className={styles.toggleIcon} />
          </button>
        </Badge>
      </Tooltip>
    </div>
  );
};

export default AIChatbot;