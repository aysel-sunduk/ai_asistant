// Kisa aciklama: Backend API cagrilarini toplar.
import type { AIInteraction } from '../models/ai.model';
import apiClient from './client';

export const aiApi = {
    getInteractions: (params?: Record<string, unknown>) => apiClient.get<AIInteraction[]>('/ai/interactions', { params }),
    getDailySuggestion: () => apiClient.get('/ai/suggestion', { timeout: 120000 }),
    getDietPlan: () => apiClient.get('/ai/diet-plan', { timeout: 120000 }),
    getMailDraft: (prompt: string) => apiClient.post('/ai/mail-draft', { prompt }, { timeout: 120000 }),
    cleanBlogContent: (content: string) => apiClient.post('/ai/blog-cleaner', { content }, { timeout: 120000 }),
    analyzeFood: (formData: FormData) => apiClient.post('/v1/ai/food/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
    }),
    getInvestmentInsights: () => apiClient.get('/ai/investment-insights', { timeout: 120000 }),
};