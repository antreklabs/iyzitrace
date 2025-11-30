/**
 * IyziTrace AI Service
 * 
 * OpenRouter-based AI service for observability insights, anomaly detection,
 * and intelligent recommendations for IyziTrace platform.
 * 
 * @author IyziTrace Team
 * @version 1.0.0
 */

import type { Region, Service, Infrastructure, Application } from './interface.service';

// ==================== CONFIGURATION ====================
// Configure these values via initAI() function

let AI_CONFIG = {
  apiKey: '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',
  model: 'deepseek/deepseek-chat',
  baseUrl: 'https://openrouter.ai/api/v1',
  temperature: 0.7,
  maxTokens: 150,
  timeout: 10000, // 30 seconds
};

// ==================== TYPE DEFINITIONS ====================

export interface AIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface AIInsightRequest {
  prompt: string;
  context?: {
    regions?: Region[];
    services?: Service[];
    infrastructures?: Infrastructure[];
    applications?: Application[];
    timeRange?: { from: string; to: string };
    customData?: Record<string, any>;
  };
  maxTokens?: number;
  temperature?: number;
}

export interface AIError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// ==================== ABORT CONTROLLER MANAGEMENT ====================

let activeController: AbortController | null = null;

/**
 * Cancel any ongoing AI request
 */
export const cancelAIRequest = (): void => {
  if (activeController) {
    activeController.abort();
    activeController = null;
    console.log('🚫 AI request cancelled');
  }
};

// ==================== INITIALIZATION ====================

/**
 * Initialize AI service with configuration
 * Must be called before using askAI()
 * 
 * @param config - AI configuration object
 * @throws Error if apiKey is not provided
 * 
 * @example
 * initAI({
 *   apiKey: 'sk-or-v1-...',
 *   model: 'anthropic/claude-3.5-sonnet',
 *   temperature: 0.7
 * });
 */
export const initAI = (config: AIConfig): void => {
  if (!config.apiKey) {
    throw new Error('AI Service: apiKey is required');
  }

  AI_CONFIG = {
    ...AI_CONFIG,
    ...config,
  };

  console.log('✅ AI Service initialized', {
    model: AI_CONFIG.model,
    baseUrl: AI_CONFIG.baseUrl,
  });
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Optimize region data for token efficiency
 * Removes unnecessary fields and summarizes data
 */
const optimizeRegionData = (regions: Region[]): string => {
  const summary = regions.map((region) => {
    const infraCount = region.infrastructures?.length || 0;
    const services: Service[] = [];
    
    region.infrastructures?.forEach((infra: Infrastructure) => {
      if (infra.services) {
        services.push(...infra.services);
        }
    });

    const healthyServices = services.filter((s) => s.status?.value === 'healthy').length;
    const errorServices = services.filter((s) => s.status?.value === 'error').length;
    const degradedServices = services.filter((s) => s.status?.value === 'degraded').length;

    return {
      region: region.name,
      infrastructures: infraCount,
      services: {
        total: services.length,
        healthy: healthyServices,
        degraded: degradedServices,
        error: errorServices,
      },
      avgLatency: services.length > 0
        ? (services.reduce((acc, s) => acc + (s.metrics?.avgDurationMs || 0), 0) / services.length).toFixed(2)
        : 0,
    };
  });

  return JSON.stringify(summary, null, 2);
};

/**
 * Optimize service data for token efficiency
 */
const optimizeServiceData = (services: Service[]): string => {
  const summary = services.map((service) => ({
    name: service.name,
    type: service.type,
    status: service.status?.value,
    metrics: {
      avgLatency: service.metrics?.avgDurationMs,
      p95Latency: service.metrics?.p95DurationMs,
      p99Latency: service.metrics?.p99DurationMs,
      callsPerSecond: service.metrics?.callsPerSecond,
      errorRate: service.status?.metrics?.errorPercentage,
    },
    operations: service.operations?.length || 0,
  }));

  return JSON.stringify(summary, null, 2);
};

/**
 * Build context string from provided data
 */
const buildContextString = (context?: AIInsightRequest['context']): string => {
  if (!context) return '';

  const parts: string[] = [];

  if (context.regions && context.regions.length > 0) {
    parts.push('📍 **Regions Data:**\n' + optimizeRegionData(context.regions));
  }

  if (context.services && context.services.length > 0) {
    parts.push('🔧 **Services Data:**\n' + optimizeServiceData(context.services));
  }

  if (context.timeRange) {
    parts.push(`⏰ **Time Range:** ${context.timeRange.from} to ${context.timeRange.to}`);
  }

  if (context.customData) {
    parts.push('📊 **Additional Data:**\n' + JSON.stringify(context.customData, null, 2));
  }

  return parts.join('\n\n');
};

// ==================== CORE AI FUNCTIONS ====================

/**
 * Make a request to OpenRouter API
 * 
 * @param messages - Array of messages for the conversation
 * @param options - Optional configuration overrides
 * @returns AI response
 * @throws AIError on failure
 */
const makeOpenRouterRequest = async (
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<AIResponse> => {
  // Cancel any existing request
  cancelAIRequest();

  // Create new abort controller
  activeController = new AbortController();
  const signal = activeController.signal;

  // Validate configuration
  if (!AI_CONFIG.apiKey) {
    throw {
      message: 'AI Service not initialized. Call initAI() first.',
      code: 'NOT_INITIALIZED',
    } as AIError;
  }

  const maxTokens = options?.maxTokens || AI_CONFIG.maxTokens;
  const temperature = options?.temperature || AI_CONFIG.temperature;

  const requestBody = {
    model: AI_CONFIG.model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  console.log('🤖 Making OpenRouter request:', {
    model: AI_CONFIG.model,
    messageCount: messages.length,
    maxTokens,
    temperature,
  });

  try {
    const timeoutId = setTimeout(() => {
      cancelAIRequest();
    }, AI_CONFIG.timeout);

    const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'IyziTrace Observability Platform',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    clearTimeout(timeoutId);
    activeController = null;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        code: errorData.error?.code || 'HTTP_ERROR',
        status: response.status,
        details: errorData,
      } as AIError;
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw {
        message: 'Invalid response format from OpenRouter',
        code: 'INVALID_RESPONSE',
        details: data,
      } as AIError;
    }

    const content = data.choices[0].message.content;
    const usage = data.usage;

    console.log('✅ OpenRouter response received:', {
      model: data.model,
      tokens: usage?.total_tokens,
      finishReason: data.choices[0].finish_reason,
    });

    return {
      content: content.trim(),
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      } : undefined,
      model: data.model,
      finishReason: data.choices[0].finish_reason,
    };
  } catch (error: any) {
    // Handle abort
    if (error.name === 'AbortError') {
      throw {
        message: 'Request was cancelled',
        code: 'CANCELLED',
      } as AIError;
    }

    // Handle timeout
    if (error.name === 'TimeoutError') {
      throw {
        message: 'Request timed out',
        code: 'TIMEOUT',
      } as AIError;
    }

    // Re-throw AIError
    if (error.code) {
      throw error as AIError;
    }

    // Generic error
    throw {
      message: error.message || 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    } as AIError;
  }
};

// ==================== SYSTEM PROMPTS ====================

const SYSTEM_PROMPT = `You are an AI assistant specialized in observability, distributed systems, and performance analysis for IyziTrace platform.

🎯 **Your Role:**
You analyze metrics, traces, logs, and service topology to provide:
- Anomaly detection and root cause analysis
- Performance optimization recommendations
- Service health insights
- Proactive alerting suggestions
- Dashboard and metric explanations

📊 **IyziTrace Platform Context:**
IyziTrace is a comprehensive observability platform that monitors:
- **Services**: Microservices with metrics (latency, error rate, throughput)
- **Traces**: Distributed traces from Tempo
- **Logs**: Application logs from Loki
- **Metrics**: System and application metrics from Prometheus
- **Infrastructure**: Hosts, regions, CPU, memory, network
- **Topology**: Service maps showing dependencies and communication patterns

🔍 **Analysis Guidelines:**
1. **Be Specific**: Reference exact metric values, service names, and timestamps
2. **Prioritize Issues**: Focus on errors, high latency, and degraded services first
3. **Provide Context**: Explain why something is a problem and its impact
4. **Actionable Insights**: Always suggest concrete next steps or actions
5. **Link to Details**: When mentioning issues, suggest which dashboard/page to check
6. **Use Emojis**: Make responses readable with appropriate emojis (🔴 error, 🟡 warning, 🟢 healthy)

📝 **Response Format:**
- Start with a brief summary (1-2 sentences)
- List key findings with severity indicators
- Provide detailed analysis for each issue
- End with actionable recommendations
- Keep responses concise but comprehensive (aim for 2-4 paragraphs)

🚨 **Critical Indicators:**
- Error rate > 1%: 🔴 Critical
- P95 latency > 1000ms: 🟡 Warning  
- P99 latency > 2000ms: 🟡 Warning
- Service degraded/error status: 🔴 Critical
- CPU > 80%: 🟡 Warning
- Memory > 85%: 🟡 Warning

Always maintain a professional, helpful, and solution-oriented tone.`;

// ==================== PUBLIC API ====================

/**
 * Ask AI for observability insights and recommendations
 * 
 * @param request - AI insight request with prompt and context
 * @returns AI response with insights
 * @throws AIError on failure
 * 
 * @example
 * // Basic usage
 * const response = await askAI({
 *   prompt: "Are there any issues in the system?"
 * });
 * 
 * @example
 * // With region context
 * const response = await askAI({
 *   prompt: "Analyze the health of these regions and identify any problems",
 *   context: {
 *     regions: regionData,
 *     timeRange: { from: '2024-01-01', to: '2024-01-02' }
 *   }
 * });
 * 
 * @example
 * // With service context
 * const response = await askAI({
 *   prompt: "Which services have the highest latency?",
 *   context: {
 *     services: serviceList
 *   },
 *   maxTokens: 1000
 * });
 */
export const askAI = async (request: AIInsightRequest): Promise<AIResponse> => {
  const { prompt, context, maxTokens, temperature } = request;

  if (!prompt || prompt.trim().length === 0) {
    throw {
      message: 'Prompt cannot be empty',
      code: 'INVALID_PROMPT',
    } as AIError;
  }

  // Build context string
  const contextString = buildContextString(context);

  // Construct user message
  const userMessage = contextString
    ? `${prompt}\n\n---\n\n${contextString}`
    : prompt;

  // Build messages array
  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  // Make request
  return await makeOpenRouterRequest(messages, { maxTokens, temperature });
};

/**
 * Ask AI with simple string prompt (shorthand)
 * 
 * @param prompt - Question or instruction for AI
 * @param regionData - Optional region data for context
 * @returns AI response content as string
 * 
 * @example
 * const answer = await askAISimple("What are the main issues?", regions);
 * console.log(answer);
 */
export const askAISimple = async (
  prompt: string,
  regionData?: Region[]
): Promise<string> => {
  const response = await askAI({
    prompt,
    context: regionData ? { regions: regionData } : undefined,
  });
  return response.content;
};

/**
 * Generate dashboard panel description based on metrics
 * 
 * @param panelName - Name of the panel/metric
 * @param metricData - Metric data or description
 * @returns AI-generated description
 */
export const generatePanelDescription = async (
  panelName: string,
  metricData?: string
): Promise<string> => {
  const prompt = `Generate a concise, user-friendly description for a dashboard panel named "${panelName}".
${metricData ? `\n\nMetric details:\n${metricData}` : ''}

The description should:
- Explain what this metric shows in 1-2 sentences
- Mention why it's important for observability
- Be suitable for display in a tooltip or info icon

Keep it under 50 words.`;

  const response = await askAI({ prompt, maxTokens: 200 });
  return response.content;
};

/**
 * Analyze service health and suggest improvements
 * 
 * @param services - Array of services to analyze
 * @returns AI analysis and recommendations
 */
export const analyzeServiceHealth = async (services: Service[]): Promise<string> => {
  const prompt = `Analyze the health and performance of these services. 
Identify any services with issues (high latency, errors, degraded status) and provide specific recommendations for improvement.

Focus on:
1. Services with error status
2. High latency services (P95 > 1000ms or P99 > 2000ms)
3. Services with unusual patterns
4. Potential bottlenecks

For each issue, suggest which dashboard or page in IyziTrace to check for more details.`;

  const response = await askAI({
    prompt,
    context: { services },
    maxTokens: 1500,
  });

  return response.content;
};

/**
 * Quick overview analysis for the overview page
 * 
 * @param regions - Region data
 * @returns Brief summary of system health
 */
export const getQuickOverview = async (regions: Region[]): Promise<string> => {
  const prompt = `Provide a quick overview of the system health based on this data.

Include:
- Overall health status (🟢 healthy, 🟡 some issues, 🔴 critical issues)
- Number of issues found
- Top 2-3 most critical problems (if any)
- 1-2 sentence summary

Keep it very concise (3-4 sentences max) - this is for a dashboard overview card.`;

  const response = await askAI({
    prompt,
    context: { regions },
    maxTokens: 300,
    temperature: 0.5,
  });

  return response.content;
};

// ==================== EXPORT ====================

export default {
  initAI,
  askAI,
  askAISimple,
  cancelAIRequest,
  generatePanelDescription,
  analyzeServiceHealth,
  getQuickOverview,
};


// ==================== USAGE EXAMPLES ====================

/*

// ============ 1. INITIALIZATION ============

import { initAI, askAI, askAISimple } from './api/service/iyzitrace-ai.service';

// Initialize once at app startup
initAI({
  apiKey: 'sk-or-v1-your-api-key-here',
  model: 'anthropic/claude-3.5-sonnet', // or 'openai/gpt-4o'
  baseUrl: 'https://openrouter.ai/api/v1',
  temperature: 0.7,
  maxTokens: 2000,
});


// ============ 2. SIMPLE USAGE ============

// Quick question without context
const answer1 = await askAISimple("What metrics should I monitor for microservices?");
console.log(answer1);

// Question with region data
const regions: Region[] = [...]; // Your region data
const answer2 = await askAISimple("Are there any issues in these regions?", regions);
console.log(answer2);


// ============ 3. ADVANCED USAGE ============

// Detailed analysis with full context
const response = await askAI({
  prompt: "Analyze system health and identify critical issues that need immediate attention",
  context: {
    regions: regionData,
    timeRange: {
      from: '2024-01-20T00:00:00Z',
      to: '2024-01-20T23:59:59Z'
    }
  },
  maxTokens: 1500,
  temperature: 0.7
});

console.log('Analysis:', response.content);
console.log('Tokens used:', response.usage?.totalTokens);


// ============ 4. SERVICE ANALYSIS ============

import { analyzeServiceHealth } from './api/service/iyzitrace-ai.service';

const services: Service[] = [...]; // Your service data
const healthAnalysis = await analyzeServiceHealth(services);
console.log(healthAnalysis);


// ============ 5. DASHBOARD DESCRIPTIONS ============

import { generatePanelDescription } from './api/service/iyzitrace-ai.service';

const description = await generatePanelDescription(
  'P95 Latency',
  'Shows the 95th percentile of response time across all services'
);
console.log(description);


// ============ 6. QUICK OVERVIEW ============

import { getQuickOverview } from './api/service/iyzitrace-ai.service';

const overview = await getQuickOverview(regions);
console.log(overview);
// Output: "🟢 System is healthy overall. 15 services running smoothly..."


// ============ 7. CANCELLATION ============

import { askAI, cancelAIRequest } from './api/service/iyzitrace-ai.service';

// Start a request
const promise = askAI({ prompt: "Long analysis..." });

// Cancel it if needed (e.g., user navigates away)
setTimeout(() => {
  cancelAIRequest();
}, 5000);

try {
  const result = await promise;
} catch (error) {
  if (error.code === 'CANCELLED') {
    console.log('Request was cancelled by user');
  }
}


// ============ 8. ERROR HANDLING ============

import { askAI, AIError } from './api/service/iyzitrace-ai.service';

try {
  const response = await askAI({
    prompt: "Analyze this data",
    context: { regions: myRegions }
  });
  console.log(response.content);
} catch (error) {
  const aiError = error as AIError;
  
  switch (aiError.code) {
    case 'NOT_INITIALIZED':
      console.error('AI service not initialized');
      break;
    case 'INVALID_PROMPT':
      console.error('Invalid prompt provided');
      break;
    case 'TIMEOUT':
      console.error('Request timed out');
      break;
    case 'CANCELLED':
      console.log('Request cancelled');
      break;
    default:
      console.error('AI Error:', aiError.message);
  }
}


// ============ 9. REACT COMPONENT EXAMPLE ============

import React, { useState } from 'react';
import { askAI, cancelAIRequest } from './api/service/iyzitrace-ai.service';
import type { Region } from './api/service/interface.service';

const AIInsightsPanel: React.FC<{ regions: Region[] }> = ({ regions }) => {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getInsights = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await askAI({
        prompt: "Provide a comprehensive analysis of system health and identify any issues",
        context: { regions }
      });
      setInsights(response.content);
    } catch (err: any) {
      setError(err.message || 'Failed to get insights');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      cancelAIRequest(); // Cleanup on unmount
    };
  }, []);

  return (
    <div>
      <button onClick={getInsights} disabled={loading}>
        {loading ? 'Analyzing...' : 'Get AI Insights'}
      </button>
      
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {insights && <div dangerouslySetInnerHTML={{ __html: insights }} />}
    </div>
  );
};


// ============ 10. GRAFANA PANEL INTEGRATION ============

// In your Grafana panel component:
import { useEffect, useState } from 'react';
import { getQuickOverview } from './api/service/iyzitrace-ai.service';

export const OverviewPanel: React.FC = () => {
  const [aiSummary, setAiSummary] = useState('');
  const regions = useRegionData(); // Your data hook

  useEffect(() => {
    if (regions.length > 0) {
      getQuickOverview(regions)
        .then(setAiSummary)
        .catch(console.error);
    }
  }, [regions]);

  return (
    <div className="ai-insights-card">
      <h3>🤖 AI Insights</h3>
      <p>{aiSummary || 'Analyzing system...'}</p>
    </div>
  );
};

*/

