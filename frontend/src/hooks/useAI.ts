// Kisa aciklama: Tekrar kullanilabilir hook mantigi icerir.
import { useCallback } from 'react';
import { aiService } from '../../services/ai.service';
import type { AIInteractionType } from '../models/ai.model';
import { useAIStore } from '../store/ai.store';

export function useAI() {
    const store = useAIStore();

    const sendPrompt = useCallback(async (type: AIInteractionType, prompt: string) => {
        store.setLoading(true);
        try {
            const interaction = await aiService.sendPrompt(type, prompt);
            store.addInteraction(interaction);
            store.setCurrentResponse(interaction.response);
            return interaction;
        } finally {
            store.setLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async (type?: AIInteractionType) => {
        store.setLoading(true);
        try {
            const interactions = await aiService.getHistory(type);
            store.setInteractions(interactions);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const generateDietPlan = useCallback(async (prompt: string) => {
        return sendPrompt('diet_plan', prompt);
    }, [sendPrompt]);

    const draftMail = useCallback(async (prompt: string) => {
        return sendPrompt('mail_draft', prompt);
    }, [sendPrompt]);

    return {
        ...store,
        sendPrompt,
        fetchHistory,
        generateDietPlan,
        draftMail,
    };
}