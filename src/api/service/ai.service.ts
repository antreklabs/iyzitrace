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

  // console.log('✅ AI Service initialized', {
  //   model: AI_CONFIG.model,
  //   baseUrl: AI_CONFIG.baseUrl,
  // });
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Estimate token count (rough approximation: ~4 chars per token)
 */
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

/**
 * Optimize region data for token efficiency
 * Removes unnecessary fields and summarizes data
 * Only includes regions/services with issues to save tokens
 */
const optimizeRegionData = (regions: Region[], maxTokens: number = 5000): string => {
  const summary: any[] = [];
  
  regions.forEach((region) => {
    const infraCount = region.infrastructures?.length || 0;
    const services: Service[] = [];
    
    region.infrastructures?.forEach((infra: Infrastructure) => {
      if (infra.services) {
        services.push(...infra.services);
      }
    });

    // Count by status
    const healthyServices = services.filter((s) => s.status?.value === 'healthy').length;
    const errorServices = services.filter((s) => s.status?.value === 'error').length;
    const degradedServices = services.filter((s) => s.status?.value === 'degraded').length;

    // Calculate average latency
    const avgLatency = services.length > 0
      ? (services.reduce((acc, s) => acc + (s.metrics?.avgDurationMs || 0), 0) / services.length).toFixed(2)
      : 0;

    // Only include regions with issues or high latency to save tokens
    const hasIssues = errorServices > 0 || degradedServices > 0 || parseFloat(avgLatency as string) > 500;

    if (hasIssues || summary.length < 3) { // Always include at least 3 regions
      const regionData: any = {
        region: region.name,
        infrastructures: infraCount,
        services: {
          total: services.length,
          healthy: healthyServices,
        },
        avgLatency,
      };

      // Only include error/degraded counts if they exist
      if (degradedServices > 0) regionData.services.degraded = degradedServices;
      if (errorServices > 0) regionData.services.error = errorServices;

      // Include problematic services details (top 3 worst)
      if (errorServices > 0 || degradedServices > 0) {
        const problematicServices = services
          .filter((s) => s.status?.value === 'error' || s.status?.value === 'degraded')
          .slice(0, 3)
          .map((s) => ({
            name: s.name,
            status: s.status?.value,
            latency: s.metrics?.avgDurationMs,
            errorRate: s.status?.metrics?.errorPercentage,
          }));
        
        if (problematicServices.length > 0) {
          regionData.issues = problematicServices;
        }
      }

      summary.push(regionData);
    }
  });

  // If still too large, truncate
  let result = JSON.stringify(summary, null, 2);
  if (estimateTokens(result) > maxTokens) {
    // Take only first few regions
    const truncated = summary.slice(0, Math.min(5, summary.length));
    result = JSON.stringify(truncated, null, 2) + '\n(... truncated to save tokens)';
  }

  return result;
};

/**
 * Optimize service data for token efficiency
 * Prioritizes problematic services
 */
const optimizeServiceData = (services: Service[], maxTokens: number = 5000): string => {
  // Separate services by status
  const errorServices = services.filter((s) => s.status?.value === 'error');
  const degradedServices = services.filter((s) => s.status?.value === 'degraded');
  const highLatencyServices = services.filter(
    (s) => (s.metrics?.p95DurationMs || 0) > 1000 && s.status?.value !== 'error'
  );

  // Prioritize problematic services
  const prioritized = [
    ...errorServices.slice(0, 5),
    ...degradedServices.slice(0, 5),
    ...highLatencyServices.slice(0, 5),
  ];

  // If no issues, include top 10 services by latency
  if (prioritized.length === 0) {
    prioritized.push(
      ...services
        .sort((a, b) => (b.metrics?.avgDurationMs || 0) - (a.metrics?.avgDurationMs || 0))
        .slice(0, 10)
    );
  }

  const summary = prioritized.map((service) => {
    const data: any = {
      name: service.name,
      status: service.status?.value,
    };

    // Only include metrics if they exist
    if (service.metrics?.avgDurationMs) data.avgLatency = service.metrics.avgDurationMs;
    if (service.metrics?.p95DurationMs && service.metrics.p95DurationMs > 500)
      data.p95 = service.metrics.p95DurationMs;
    if (service.metrics?.p99DurationMs && service.metrics.p99DurationMs > 1000)
      data.p99 = service.metrics.p99DurationMs;
    if (service.status?.metrics?.errorPercentage)
      data.errorRate = service.status.metrics.errorPercentage;

    return data;
  });

  let result = JSON.stringify(summary, null, 2);
  
  // Add stats summary
  const stats = `\nTotal Services: ${services.length} | Showing: ${summary.length} (prioritized by issues)`;
  result = stats + '\n' + result;

  // If still too large, truncate
  if (estimateTokens(result) > maxTokens) {
    const truncated = summary.slice(0, Math.min(10, summary.length));
    result =
      stats +
      '\n' +
      JSON.stringify(truncated, null, 2) +
      '\n(... truncated to save tokens)';
  }

  return result;
};

/**
 * Build context string from provided data
 * Limits total context size to prevent token overflow
 */
const buildContextString = (context?: AIInsightRequest['context'], maxContextTokens: number = 10000): string => {
  if (!context) return '';

  const parts: string[] = [];
  let estimatedTokens = 0;

  // Add regions data (limit to 5000 tokens)
  if (context.regions && context.regions.length > 0) {
    const regionData = '📍 **Regions Data:**\n' + optimizeRegionData(context.regions, 5000);
    const tokens = estimateTokens(regionData);
    if (estimatedTokens + tokens < maxContextTokens) {
      parts.push(regionData);
      estimatedTokens += tokens;
    }
  }

  // Add services data (limit to 5000 tokens)
  if (context.services && context.services.length > 0 && estimatedTokens < maxContextTokens) {
    const serviceData = '🔧 **Services Data:**\n' + optimizeServiceData(context.services, 5000);
    const tokens = estimateTokens(serviceData);
    if (estimatedTokens + tokens < maxContextTokens) {
      parts.push(serviceData);
      estimatedTokens += tokens;
    } else {
      // Try with smaller limit
      const smallerData = '🔧 **Services Data:**\n' + optimizeServiceData(context.services, 2000);
      parts.push(smallerData);
      estimatedTokens += estimateTokens(smallerData);
    }
  }

  // Add time range (minimal tokens)
  if (context.timeRange && estimatedTokens < maxContextTokens) {
    parts.push(`⏰ **Time Range:** ${context.timeRange.from} to ${context.timeRange.to}`);
  }

  // Skip custom data if we're close to limit
  if (context.customData && estimatedTokens < maxContextTokens * 0.8) {
    const customStr = JSON.stringify(context.customData, null, 2);
    if (estimateTokens(customStr) < 1000) {
      parts.push('📊 **Additional Data:**\n' + customStr);
    }
  }

  const result = parts.join('\n\n');
  console.log(`📊 Context built: ~${estimateTokens(result)} tokens (limit: ${maxContextTokens})`);
  
  return result;
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

const SYSTEM_PROMPT = `You are an observability AI for IyziTrace platform. Analyze metrics, traces, and service topology.

**Guidelines:**
- Prioritize errors, high latency (P95>1000ms), degraded services
- Be specific: reference exact values, service names
- Provide actionable recommendations
- Use emojis: 🔴 critical, 🟡 warning, 🟢 healthy
- Keep responses concise (2-4 paragraphs)

**Response format:**
1. Brief summary
2. Key findings with severity
3. Actionable recommendations`;

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

  // Estimate system prompt tokens
  const systemTokens = estimateTokens(SYSTEM_PROMPT);
  const promptTokens = estimateTokens(prompt);
  const responseTokens = maxTokens || AI_CONFIG.maxTokens || 150;

  // Calculate available tokens for context (conservative limit for deepseek)
  // DeepSeek context: 64K tokens, but we use 30K to be safe
  const totalAvailable = 30000;
  const availableForContext = totalAvailable - systemTokens - promptTokens - responseTokens - 1000; // 1000 buffer

  if (availableForContext < 1000) {
    console.warn('⚠️ Very limited context space available, using minimal context');
  }

  // Build context string with token limit
  const contextString = buildContextString(context, Math.max(1000, availableForContext));

  // Construct user message
  const userMessage = contextString
    ? `${prompt}\n\n---\n\n${contextString}`
    : prompt;

  // Final token check
  const totalEstimatedTokens = systemTokens + estimateTokens(userMessage) + responseTokens;
  console.log(`📊 Estimated tokens - System: ${systemTokens}, User: ${estimateTokens(userMessage)}, Response: ${responseTokens}, Total: ${totalEstimatedTokens}`);

  if (totalEstimatedTokens > totalAvailable) {
    console.error(`❌ Token limit would be exceeded: ${totalEstimatedTokens} > ${totalAvailable}`);
    throw {
      message: `Request too large. Estimated ${totalEstimatedTokens} tokens, limit is ${totalAvailable}. Try reducing the amount of data or being more specific in your question.`,
      code: 'TOKEN_LIMIT_EXCEEDED',
      details: {
        estimated: totalEstimatedTokens,
        limit: totalAvailable,
      },
    } as AIError;
  }

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

