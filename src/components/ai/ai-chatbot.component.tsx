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
import { getBackendSrv } from '@grafana/runtime';
import {
  initAI,
  askAI,
  type AIResponse,
} from '../../api/service/ai.service';
import type { PluginJsonData } from '../../interfaces/utils/options';
import '../../assets/styles/components/ai/ai-chatbot.styles';

const PLUGIN_ID = 'antreklabs-iyzitrace-app';

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
          apiKey: aiConfig?.apiKey || '',
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
    <div className="chatbot-wrapper">
      {isOpen && (
        <div className={`chatbot-window ${isFullscreen ? 'fullscreen' : ''}`}>
          {
          }
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <Avatar icon={<RobotOutlined />} className="chatbot-header-avatar" />
              <div>
                <h3>AI Assistant</h3>
                <span>{initialized ? 'Online' : 'Connecting...'}</span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-icon-btn" onClick={() => setFullscreen(!isFullscreen)}>
                {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              </button>
              <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
                <CloseOutlined />
              </button>
            </div>
          </div>

          {
          }
          <div className="chatbot-content">
            <div className="chatbot-messages-area">
              {messages.map(msg => (
                <div key={msg.id} className={`chatbot-message ${msg.role}`}>
                  <div className={`chatbot-avatar ${msg.role}`}>
                    {msg.role === 'ai' ? <RobotOutlined /> : '👤'}
                  </div>
                  <div>
                    <div className={`chatbot-bubble ${msg.role}`}>
                      {formatContent(msg.content)}
                    </div>
                    {msg.role === 'ai' && !msg.isError && (
                      <>
                        <div className="chatbot-actions">
                          <button className="chatbot-action-btn" onClick={() => copyToClipboard(msg.content)}>
                            <CopyOutlined /> Copy
                          </button>
                          <button className="chatbot-action-btn" onClick={() => sendMessage('Tell me more')}>
                            <ThunderboltOutlined /> Tell me more
                          </button>
                          <button className="chatbot-action-btn" onClick={() => sendMessage('Any other issues?')}>
                            <BugOutlined /> Find more issues
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chatbot-message ai">
                  <div className="chatbot-avatar ai">
                    <LoadingOutlined />
                  </div>
                  <div className="chatbot-bubble ai">
                    <div className="chatbot-typing">
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
              <div className="chatbot-suggestions">
                <button className="chatbot-chip" onClick={() => sendMessage('Analyze this data for anomalies')}>
                  <BugOutlined /> Find Anomalies
                </button>
                <button className="chatbot-chip" onClick={() => sendMessage('Summarize performance metrics')}>
                  <BarChartOutlined /> Summarize Performance
                </button>
                <button className="chatbot-chip" onClick={() => sendMessage('Give me optimization tips')}>
                  <ThunderboltOutlined /> Optimization Tips
                </button>
              </div>
            )}

            {
            }
            <div className="chatbot-footer">
              <div className="chatbot-input-wrapper">
                <Input.TextArea
                  className="chatbot-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AI..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={loading || !initialized}
                />
                <button
                  className="chatbot-send-btn"
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
            className="chatbot-toggle-button"
            onClick={() => setIsOpen(!isOpen)}
          >
            <RobotOutlined className="chatbot-toggle-icon" />
          </button>
        </Badge>
      </Tooltip>
    </div>
  );
};

export default AIChatbot;