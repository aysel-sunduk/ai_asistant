import type { AIInteraction } from '../models/ai.model';
import apiClient from './client';

export const aiApi = {
    getInteractions: (params?: Record<string, unknown>) => apiClient.get<AIInteraction[]>('/ai/interactions', { params }),
    getDailySuggestion: () => apiClient.get('/ai/suggestion'),
    getDietPlan: () => apiClient.get('/ai/diet-plan'),
    getMailDraft: (prompt: string) => apiClient.post('/ai/mail-draft', { prompt }),
    cleanBlogContent: (content: string) => apiClient.post('/ai/blog-cleaner', { content }),
    getInvestmentInsights: () => apiClient.get('/ai/investment-insights'),
};
