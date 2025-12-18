
import type { Region, Service, Infrastructure, Application } from './interface.service';

let AI_CONFIG = {
  apiKey: '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',
  model: 'deepseek/deepseek-chat',
  baseUrl: 'https://openrouter.ai/api/v1',
  temperature: 0.7,
  maxTokens: 150,
  timeout: 10000,
};

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

let activeController: AbortController | null = null;

export const cancelAIRequest = (): void => {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
};

export const initAI = (config: AIConfig): void => {
  if (!config.apiKey) {
    throw new Error('AI Service: apiKey is required');
  }

  AI_CONFIG = {
    ...AI_CONFIG,
    ...config,
  };

};

const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

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

    const healthyServices = services.filter((s) => s.status?.value === 'healthy').length;
    const errorServices = services.filter((s) => s.status?.value === 'error').length;
    const degradedServices = services.filter((s) => s.status?.value === 'degraded').length;

    const avgLatency = services.length > 0
      ? (services.reduce((acc, s) => acc + (s.metrics?.avgDurationMs || 0), 0) / services.length).toFixed(2)
      : 0;

    const hasIssues = errorServices > 0 || degradedServices > 0 || parseFloat(avgLatency as string) > 500;

    if (hasIssues || summary.length < 3) {
      const regionData: any = {
        region: region.name,
        infrastructures: infraCount,
        services: {
          total: services.length,
          healthy: healthyServices,
        },
        avgLatency,
      };

      if (degradedServices > 0) regionData.services.degraded = degradedServices;
      if (errorServices > 0) regionData.services.error = errorServices;

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

  let result = JSON.stringify(summary, null, 2);
  if (estimateTokens(result) > maxTokens) {
    const truncated = summary.slice(0, Math.min(5, summary.length));
    result = JSON.stringify(truncated, null, 2) + '\n(... truncated to save tokens)';
  }

  return result;
};

const optimizeServiceData = (services: Service[], maxTokens: number = 5000): string => {
  const errorServices = services.filter((s) => s.status?.value === 'error');
  const degradedServices = services.filter((s) => s.status?.value === 'degraded');
  const highLatencyServices = services.filter(
    (s) => (s.metrics?.p95DurationMs || 0) > 1000 && s.status?.value !== 'error'
  );

  const prioritized = [
    ...errorServices.slice(0, 5),
    ...degradedServices.slice(0, 5),
    ...highLatencyServices.slice(0, 5),
  ];

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
  
  const stats = `\nTotal Services: ${services.length} | Showing: ${summary.length} (prioritized by issues)`;
  result = stats + '\n' + result;

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

const buildContextString = (context?: AIInsightRequest['context'], maxContextTokens: number = 10000): string => {
  if (!context) return '';

  const parts: string[] = [];
  let estimatedTokens = 0;

  if (context.regions && context.regions.length > 0) {
    const regionData = '📍 **Regions Data:**\n' + optimizeRegionData(context.regions, 5000);
    const tokens = estimateTokens(regionData);
    if (estimatedTokens + tokens < maxContextTokens) {
      parts.push(regionData);
      estimatedTokens += tokens;
    }
  }

  if (context.services && context.services.length > 0 && estimatedTokens < maxContextTokens) {
    const serviceData = '🔧 **Services Data:**\n' + optimizeServiceData(context.services, 5000);
    const tokens = estimateTokens(serviceData);
    if (estimatedTokens + tokens < maxContextTokens) {
      parts.push(serviceData);
      estimatedTokens += tokens;
    } else {
      const smallerData = '🔧 **Services Data:**\n' + optimizeServiceData(context.services, 2000);
      parts.push(smallerData);
      estimatedTokens += estimateTokens(smallerData);
    }
  }

  if (context.timeRange && estimatedTokens < maxContextTokens) {
    parts.push(`⏰ **Time Range:** ${context.timeRange.from} to ${context.timeRange.to}`);
  }

  if (context.customData && estimatedTokens < maxContextTokens * 0.8) {
    const customStr = JSON.stringify(context.customData, null, 2);
    if (estimateTokens(customStr) < 1000) {
      parts.push('📊 **Additional Data:**\n' + customStr);
    }
  }

  const result = parts.join('\n\n');
  return result;
};

const makeOpenRouterRequest = async (
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<AIResponse> => {
  cancelAIRequest();

  activeController = new AbortController();
  const signal = activeController.signal;

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
    if (error.name === 'AbortError') {
      throw {
        message: 'Request was cancelled',
        code: 'CANCELLED',
      } as AIError;
    }

    if (error.name === 'TimeoutError') {
      throw {
        message: 'Request timed out',
        code: 'TIMEOUT',
      } as AIError;
    }

    if (error.code) {
      throw error as AIError;
    }

    throw {
      message: error.message || 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    } as AIError;
  }
};

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

export const askAI = async (request: AIInsightRequest): Promise<AIResponse> => {
  const { prompt, context, maxTokens, temperature } = request;

  if (!prompt || prompt.trim().length === 0) {
    throw {
      message: 'Prompt cannot be empty',
      code: 'INVALID_PROMPT',
    } as AIError;
  }

  const systemTokens = estimateTokens(SYSTEM_PROMPT);
  const promptTokens = estimateTokens(prompt);
  const responseTokens = maxTokens || AI_CONFIG.maxTokens || 150;

  const totalAvailable = 30000;
  const availableForContext = totalAvailable - systemTokens - promptTokens - responseTokens - 1000;

  if (availableForContext < 1000) {
  }

  const contextString = buildContextString(context, Math.max(1000, availableForContext));

  const userMessage = contextString
    ? `${prompt}\n\n---\n\n${contextString}`
    : prompt;

  const totalEstimatedTokens = systemTokens + estimateTokens(userMessage) + responseTokens;

  if (totalEstimatedTokens > totalAvailable) {
    throw {
      message: `Request too large. Estimated ${totalEstimatedTokens} tokens, limit is ${totalAvailable}. Try reducing the amount of data or being more specific in your question.`,
      code: 'TOKEN_LIMIT_EXCEEDED',
      details: {
        estimated: totalEstimatedTokens,
        limit: totalAvailable,
      },
    } as AIError;
  }

  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  return await makeOpenRouterRequest(messages, { maxTokens, temperature });
};

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