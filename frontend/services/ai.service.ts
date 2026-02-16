import { aiApi } from '../src/api/ai.api';
import type { AIInteraction, AIInteractionType } from '../src/models/ai.model';

export const aiService = {
    sendPrompt: async (type: AIInteractionType, prompt: string): Promise<AIInteraction> => {
        const response = await aiApi.sendPrompt({ type, prompt });
        return response.data;
    },

    getHistory: async (type?: AIInteractionType): Promise<AIInteraction[]> => {
        const response = await aiApi.getHistory(type);
        return response.data;
    },

    // Özel AI fonksiyonları
    generateDietPlan: async (prompt: string): Promise<AIInteraction> => {
        return aiService.sendPrompt('diet_plan', prompt);
    },

    draftMail: async (prompt: string): Promise<AIInteraction> => {
        return aiService.sendPrompt('mail_draft', prompt);
    },

    cleanupBlogPost: async (content: string): Promise<AIInteraction> => {
        return aiService.sendPrompt('blog_cleanup', content);
    },
};
