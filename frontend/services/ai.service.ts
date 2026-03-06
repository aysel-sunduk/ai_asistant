// Kisa aciklama: Servis akislarini yonetir.
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

    analyzeFood: async (imageUri: string): Promise<any> => {
        const formData = new FormData();
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('file', {
            uri: imageUri,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
        } as any);

        const response = await aiApi.analyzeFood(formData);
        return response.data.data;
    },
};
