/* AI Service Interfaces */

import type { Region, Service, Infrastructure, Application } from '../core/service.interface';

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
