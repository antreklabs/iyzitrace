import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Space, Tag, message, Switch } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
  BugOutlined,
  DashboardOutlined,
  CopyOutlined,
  DeleteOutlined,
  FireOutlined,
  HeartOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { css, keyframes } from '@emotion/css';
import { PluginPage, getBackendSrv } from '@grafana/runtime';
import { PageLayoutType } from '@grafana/data';
import {
  initAI,
  askAI,
  cancelAIRequest,
  type AIResponse,
  type AIError,
} from '../../api/service/ai.service';
import { getRegions } from '../../api/service/service-map.service';
import { getServicesTableData } from '../../api/service/services.service';
import { FilterParamsModel } from '../../api/service/query.service';
import { isAIConfigured } from '../../api/service/landing.service';
import type { Region, Service, Infrastructure } from '../../api/service/interface.service';
import type { PluginJsonData } from '../../interfaces/utils/options';

const { TextArea } = Input;

const PLUGIN_ID = 'iyzitrace-app';

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const typing = keyframes`
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
`;

const styles = {
  container: css`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #667eea 100%);
    background-size: 400% 400%;
    animation: ${gradientAnimation} 15s ease infinite;
    padding: 40px 20px;
  `,
  
  innerContainer: css`
    max-width: 1400px;
    margin: 0 auto;
    animation: ${fadeIn} 0.6s ease-out;
  `,
  
  header: css`
    text-align: center;
    margin-bottom: 40px;
    color: white;
  `,
  
  title: css`
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 16px 0;
    background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px rgba(255,255,255,0.3);
    letter-spacing: -1px;
  `,
  
  subtitle: css`
    font-size: 18px;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    font-weight: 300;
  `,
  
  quickActionsGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  `,
  
  quickActionCard: css`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    
    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
      border-color: #667eea;
      animation: ${pulse} 0.6s ease;
    }
  `,
  
  quickActionIcon: css`
    font-size: 36px;
    margin-bottom: 12px;
    display: block;
  `,
  
  quickActionTitle: css`
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #1a1a1a;
  `,
  
  quickActionDesc: css`
    font-size: 14px;
    color: #666;
    margin: 0;
  `,
  
  mainCard: css`
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.3);
  `,
  
  chatContainer: css`
    height: 600px;
    display: flex;
    flex-direction: column;
  `,
  
  messagesArea: css`
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
    
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f0f0f0;
      border-radius: 10px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
    }
  `,
  
  emptyState: css`
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
    text-align: center;
  `,
  
  emptyIcon: css`
    font-size: 72px;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `,
  
  emptyTitle: css`
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0 0 12px 0;
  `,
  
  emptyDesc: css`
    font-size: 16px;
    color: #666;
    max-width: 500px;
  `,
  
  message: css`
    margin-bottom: 24px;
    animation: ${fadeIn} 0.4s ease-out;
  `,
  
  userMessage: css`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  `,
  
  aiMessage: css`
    display: flex;
    justify-content: flex-start;
    gap: 12px;
  `,
  
  messageAvatar: css`
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  `,
  
  userAvatar: css`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  `,
  
  aiAvatar: css`
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
  `,
  
  messageBubble: css`
    max-width: 70%;
    padding: 16px 20px;
    border-radius: 16px;
    position: relative;
  `,
  
  userBubble: css`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom-right-radius: 4px;
  `,
  
  aiBubble: css`
    background: white;
    color: #333;
    border: 1px solid #e8e8e8;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  `,
  
  messageContent: css`
    font-size: 15px;
    line-height: 1.6;
    word-wrap: break-word;
    
    p { margin: 0 0 12px 0; }
    p:last-child { margin: 0; }
    
    h1, h2, h3, h4 {
      margin: 16px 0 12px 0;
      font-weight: 600;
    }
    
    ul, ol {
      margin: 12px 0;
      padding-left: 24px;
    }
    
    li { margin: 6px 0; }
    
    code {
      background: rgba(0, 0, 0, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
    }
    
    pre {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 12px 0;
      
      code {
        background: transparent;
        padding: 0;
        color: inherit;
      }
    }
    
    blockquote {
      border-left: 4px solid #667eea;
      padding-left: 16px;
      margin: 12px 0;
      color: #666;
      font-style: italic;
    }
  `,
  
  messageActions: css`
    display: flex;
    gap: 8px;
    margin-top: 12px;
  `,
  
  messageActionBtn: css`
    font-size: 12px;
    padding: 4px 12px;
    height: auto;
  `,
  
  messageMetadata: css`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 12px;
    color: #999;
  `,
  
  inputArea: css`
    padding: 24px;
    background: white;
    border-top: 1px solid #e8e8e8;
  `,
  
  inputRow: css`
    display: flex;
    gap: 12px;
    align-items: flex-end;
  `,
  
  textAreaWrapper: css`
    flex: 1;
  `,
  
  sendButton: css`
    height: 48px;
    min-width: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    flex-shrink: 0;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(102, 126, 234, 0.6);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  
  cancelButton: css`
    height: 48px;
    min-width: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
    border: none;
    box-shadow: 0 4px 16px rgba(255, 77, 79, 0.4);
    transition: all 0.3s ease;
    flex-shrink: 0;
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(255, 77, 79, 0.6);
      background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%) !important;
      color: white !important;
    }
    
    &:active {
      transform: translateY(0);
    }
  `,
  
  contextBar: css`
    padding: 16px 24px;
    background: linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  `,
  
  contextSection: css`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    
    span {
      color: #333;
      font-weight: 500;
    }
  `,
  
  statsBar: css`
    padding: 16px 24px;
    background: linear-gradient(90deg, #f6f8ff 0%, #f8f6ff 100%);
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  `,
  
  statsGrid: css`
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  `,
  
  statItem: css`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #666;
  `,
  
  statValue: css`
    font-weight: 600;
    color: #333;
  `,
  
  loadingDots: css`
    display: inline-flex;
    gap: 4px;
    
    span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #667eea;
      animation: ${typing} 1.4s infinite;
      
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  `,
  
  suggestedQuestions: css`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 16px;
  `,
  
  suggestionChip: css`
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    color: #667eea;
    border-radius: 20px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    
    &:hover {
      background: rgba(102, 126, 234, 0.2);
      border-color: #667eea;
      transform: translateY(-2px);
    }
  `,
  
  settingsPanel: css`
    .ant-collapse-header {
      background: #fafafa !important;
      border-radius: 8px !important;
    }
  `,
  
  statusCard: css`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 32px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  `,
  
  statusLeft: css`
    display: flex;
    align-items: center;
    gap: 16px;
  `,
  
  statusIcon: css`
    font-size: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  
  statusInfo: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  
  statusTitle: css`
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  `,
  
  statusDesc: css`
    font-size: 14px;
    color: #666;
    margin: 0;
  `,
  
  statusBadge: css`
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 13px;
  `,
  
  statusBadgeActive: css`
    background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
    color: white;
  `,
  
  statusBadgeInactive: css`
    background: linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%);
    color: white;
  `,
};

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => Promise<void>;
}

const AIPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [includeRegions, setIncludeRegions] = useState(true);
  const [includeInfrastructures, setIncludeInfrastructures] = useState(true);
  const [includeApplications, setIncludeApplications] = useState(true);
  const [includeServices, setIncludeServices] = useState(true);
  const [includeOperations, setIncludeOperations] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [aiModel, setAiModel] = useState('deepseek/deepseek-chat');
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  useEffect(() => {
    const initializeAI = async () => {
      try {
        const apiKeyConfigured = await isAIConfigured();
        setIsApiKeyConfigured(apiKeyConfigured);
        
        const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
        const aiConfig = (settings?.jsonData as PluginJsonData)?.aiConfig;
        
        const config = {
          apiKey: aiConfig?.apiKey || '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',
          model: aiConfig?.model || 'deepseek/deepseek-chat',
          baseUrl: 'https://openrouter.ai/api/v1',
          temperature: aiConfig?.temperature ?? 0.7,
          maxTokens: aiConfig?.maxTokens ?? 1500,
        };
        
        initAI(config);
        setAiModel(config.model);
        setInitialized(true);
        message.success('🤖 AI Service initialized successfully!');
      } catch (error) {
        message.error('Failed to initialize AI service. Please configure in Settings.');
      }
    };
    initializeAI();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const filterParams = new FilterParamsModel({
          from: String(Date.now() - 86400000),
          to: String(Date.now()),
        });
        const [regionsData, servicesData] = await Promise.all([
          getRegions(filterParams),
          getServicesTableData(filterParams),
        ]);
        setRegions(regionsData);
        setServices(servicesData);
      } catch (error) {
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickActions: QuickAction[] = [
    {
      id: 'overview',
      title: '🎯 Quick Overview',
      description: 'Get instant system health summary',
      icon: <DashboardOutlined className={styles.quickActionIcon} style={{ color: '#667eea' }} />,
      color: '#667eea',
      action: async () => {
        if (regions.length === 0) {
          message.warning('No region data available');
          return;
        }
        await sendMessage('Provide a quick overview of system health', true);
      },
    },
    {
      id: 'service-health',
      title: '❤️ Service Health',
      description: 'Analyze all services performance',
      icon: <HeartOutlined className={styles.quickActionIcon} style={{ color: '#f5576c' }} />,
      color: '#f5576c',
      action: async () => {
        if (services.length === 0) {
          message.warning('No service data available');
          return;
        }
        await sendMessage('Analyze service health and identify issues', true);
      },
    },
    {
      id: 'anomalies',
      title: '🔥 Find Anomalies',
      description: 'Detect unusual patterns and issues',
      icon: <BugOutlined className={styles.quickActionIcon} style={{ color: '#ff6b6b' }} />,
      color: '#ff6b6b',
      action: async () => {
        await sendMessage('Identify any anomalies, unusual patterns, or critical issues in the system', true);
      },
    },
    {
      id: 'recommendations',
      title: '⚡ Recommendations',
      description: 'Get optimization suggestions',
      icon: <ThunderboltOutlined className={styles.quickActionIcon} style={{ color: '#feca57' }} />,
      color: '#feca57',
      action: async () => {
        await sendMessage('Provide specific recommendations for improving system performance and reliability', true);
      },
    },
  ];

  const sendMessage = async (text: string, isQuickAction: boolean = false) => {
    if (!text.trim() || loading || !initialized) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!isQuickAction) setInput('');
    setLoading(true);

    try {
      const context: any = {};
      
      if (includeRegions && regions.length > 0) {
        const filteredRegions = regions.map(region => {
          const regionCopy = { ...region };
          
          if (!includeInfrastructures) {
            delete regionCopy.infrastructures;
          } else if (includeInfrastructures && regionCopy.infrastructures) {
            if (!includeApplications) {
              regionCopy.infrastructures = regionCopy.infrastructures.map(infra => {
                const infraCopy = { ...infra };
                delete infraCopy.applications;
                return infraCopy;
              });
            } else if (includeApplications && regionCopy.infrastructures) {
              if (!includeServices) {
                regionCopy.infrastructures = regionCopy.infrastructures.map(infra => {
                  const infraCopy = { ...infra };
                  delete infraCopy.services;
                  return infraCopy;
                });
              } else if (includeServices && !includeOperations) {
                regionCopy.infrastructures = regionCopy.infrastructures.map(infra => {
                  const infraCopy = { ...infra };
                  if (infraCopy.services) {
                    infraCopy.services = infraCopy.services.map(svc => {
                      const svcCopy = { ...svc };
                      delete svcCopy.operations;
                      return svcCopy;
                    });
                  }
                  return infraCopy;
                });
              }
            }
          }
          
          return regionCopy;
        });
        
        context.regions = filteredRegions;
      }
      
      if (includeServices && services.length > 0) {
        const filteredServices = includeOperations 
          ? services 
          : services.map(s => {
              const sCopy = { ...s };
              delete sCopy.operations;
              return sCopy;
            });
        context.services = filteredServices;
      }

      const response: AIResponse = await askAI({
        prompt: text,
        context: Object.keys(context).length > 0 ? context : undefined,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.content,
        timestamp: new Date(),
        tokens: response.usage,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setRequestCount((prev) => prev + 1);
      if (response.usage) {
        setTotalTokens((prev) => prev + response.usage!.totalTokens);
      }
    } catch (error: any) {
      const aiError = error as AIError;
      message.error(aiError.message || 'Failed to get AI response');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `❌ Error: ${aiError.message || 'Something went wrong'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
  };

  const clearChat = () => {
    setMessages([]);
    setTotalTokens(0);
    setRequestCount(0);
    message.info('Chat cleared');
  };

  const cancelRequest = () => {
    cancelAIRequest();
    setLoading(false);
    message.info('Request cancelled');
  };

  const formatMessageContent = (content: string) => {
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');
    
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const suggestedQuestions = [
    'What services have the highest latency?',
    'Are there any critical issues?',
    'Show me error rate trends',
    'Which services are degraded?',
    'Analyze infrastructure health',
  ];

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <div className={styles.container}>
        <div className={styles.innerContainer}>
          {
}
          <div className={styles.header}>
            <h1 className={styles.title}>
              <RobotOutlined /> IyziTrace AI Assistant
            </h1>
            <p className={styles.subtitle}>
              Intelligent observability insights powered by AI • Analyze, detect, and optimize in seconds
            </p>
          </div>

          {
}
          <div className={styles.statusCard}>
            <div className={styles.statusLeft}>
              <div className={styles.statusIcon}>
                <RobotOutlined style={{ 
                  color: isApiKeyConfigured ? '#52c41a' : '#8c8c8c',
                }} />
              </div>
              <div className={styles.statusInfo}>
                <h3 className={styles.statusTitle}>AI Assistant Configuration</h3>
                <p className={styles.statusDesc}>
                  {isApiKeyConfigured 
                    ? 'API key is configured and ready to use' 
                    : 'API key is not configured. Please configure in Settings.'}
                </p>
              </div>
            </div>
            <div className={`${styles.statusBadge} ${
              isApiKeyConfigured ? styles.statusBadgeActive : styles.statusBadgeInactive
            }`}>
              {isApiKeyConfigured ? 'Active' : 'Inactive'}
            </div>
          </div>

          {
}
          <div className={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <div
                key={action.id}
                className={styles.quickActionCard}
                onClick={() => action.action()}
              >
                {action.icon}
                <h3 className={styles.quickActionTitle}>{action.title}</h3>
                <p className={styles.quickActionDesc}>{action.description}</p>
              </div>
            ))}
          </div>

          {
}
          <Card className={styles.mainCard} bordered={false}>
            {
}
            <div className={styles.statsBar}>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <FireOutlined style={{ color: '#667eea' }} />
                  <span>Requests: <span className={styles.statValue}>{requestCount}</span></span>
                </div>
                <div className={styles.statItem}>
                  <BarChartOutlined style={{ color: '#f5576c' }} />
                  <span>Tokens: <span className={styles.statValue}>{totalTokens.toLocaleString()}</span></span>
                </div>
                {
}
              </div>
              <Space>
                <Button size="small" icon={<DeleteOutlined />} onClick={clearChat}>
                  Clear
                </Button>
              </Space>
            </div>

            {
}
            <div className={styles.contextBar}>
              <div className={styles.contextSection}>
                <span style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>Context:</span>
                <Space size={4}>
                  <Switch
                    size="small"
                    checked={includeRegions}
                    onChange={setIncludeRegions}
                  />
                  <span style={{ color: '#333', fontSize: '13px' }}>Regions ({regions.length})</span>
                </Space>
                <Space size={4}>
                  <Switch
                    size="small"
                    checked={includeInfrastructures}
                    onChange={setIncludeInfrastructures}
                  />
                  <span style={{ color: '#333', fontSize: '13px' }}>Infrastructures ({
                    regions.reduce((sum: number, r: Region) => sum + (r.infrastructures?.length || 0), 0)
                  })</span>
                </Space>
                <Space size={4}>
                  <Switch
                    size="small"
                    checked={includeApplications}
                    onChange={setIncludeApplications}
                  />
                  <span style={{ color: '#333', fontSize: '13px' }}>Applications ({
                    regions.reduce((sum: number, r: Region) => {
                      if (!r.infrastructures) return sum;
                      const infraCount = (r.infrastructures as Infrastructure[]).reduce((s: number, i: Infrastructure) => {
                        return s + (i.applications?.length || 0);
                      }, 0);
                      return sum + infraCount;
                    }, 0)
                  })</span>
                </Space>
                <Space size={4}>
                  <Switch
                    size="small"
                    checked={includeServices}
                    onChange={setIncludeServices}
                  />
                  <span style={{ color: '#333', fontSize: '13px' }}>Services ({services.length})</span>
                </Space>
                <Space size={4}>
                  <Switch
                    size="small"
                    checked={includeOperations}
                    onChange={setIncludeOperations}
                  />
                  <span style={{ color: '#333', fontSize: '13px' }}>Operations ({
                    services.reduce((sum: number, s: Service) => sum + (s.operations?.length || 0), 0)
                  })</span>
                </Space>
              </div>
              <Tag 
                icon={<RobotOutlined />}
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '4px 12px',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                {aiModel}
              </Tag>
            </div>

            {
}
            <div className={styles.chatContainer}>
              <div className={styles.messagesArea}>
                {messages.length === 0 ? (
                  <div className={styles.emptyState}>
                    <RobotOutlined className={styles.emptyIcon} />
                    <h2 className={styles.emptyTitle}>Welcome to IyziTrace AI</h2>
                    <p className={styles.emptyDesc}>
                      Ask me anything about your observability data, system health, or performance issues.
                      I can analyze metrics, detect anomalies, and provide actionable recommendations.
                    </p>
                    <div className={styles.suggestedQuestions}>
                      {suggestedQuestions.map((q, i) => (
                        <div
                          key={i}
                          className={styles.suggestionChip}
                          onClick={() => setInput(q)}
                        >
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`${styles.message} ${
                          msg.role === 'user' ? styles.userMessage : styles.aiMessage
                        }`}
                      >
                        {msg.role === 'ai' && (
                          <div className={`${styles.messageAvatar} ${styles.aiAvatar}`}>
                            <RobotOutlined />
                          </div>
                        )}
                        <div>
                          <div
                            className={`${styles.messageBubble} ${
                              msg.role === 'user' ? styles.userBubble : styles.aiBubble
                            }`}
                          >
                            <div className={styles.messageContent}>
                              {formatMessageContent(msg.content)}
                            </div>
                            {msg.role === 'ai' && (
                              <>
                            {msg.tokens && (
                              <div className={styles.messageMetadata}>
                                <span>
                                  <CodeOutlined /> {msg.tokens.totalTokens} tokens
                                </span>
                                <span>•</span>
                                <span>
                                  <ClockCircleOutlined /> {msg.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                                <div className={styles.messageActions}>
                                  <Button
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => copyToClipboard(msg.content)}
                                    className={styles.messageActionBtn}
                                  >
                                    Copy
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {msg.role === 'user' && (
                          <div className={`${styles.messageAvatar} ${styles.userAvatar}`}>
                            👤
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className={`${styles.message} ${styles.aiMessage}`}>
                        <div className={`${styles.messageAvatar} ${styles.aiAvatar}`}>
                          <RobotOutlined />
                        </div>
                        <div className={`${styles.messageBubble} ${styles.aiBubble}`}>
                          <div className={styles.loadingDots}>
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {
}
              <div className={styles.inputArea}>
                <div className={styles.inputRow}>
                  <div className={styles.textAreaWrapper}>
                    <TextArea
                      ref={textAreaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your observability data..."
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      disabled={loading || !initialized}
                      style={{
                        fontSize: '15px',
                        borderRadius: '12px',
                        border: '2px solid #e8e8e8',
                        padding: '12px 16px',
                      }}
                    />
                  </div>
                  {loading ? (
                    <Button
                      icon={<CloseCircleOutlined />}
                      onClick={cancelRequest}
                      className={styles.cancelButton}
                    />
                  ) : (
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSend}
                      disabled={!input.trim() || !initialized}
                      className={styles.sendButton}
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PluginPage>
  );
};

export default AIPage;