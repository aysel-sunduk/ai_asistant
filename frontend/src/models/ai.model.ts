// Kisa aciklama: Destekleyici modul kodu icerir.
export type AIInteractionType =
    | 'diet_plan'
    | 'mail_draft'
    | 'blog_cleanup'
    | 'finance_advice'
    | 'general_chat';

export interface AIInteraction {
    id: string;
    userId: string;
    type: AIInteractionType;
    prompt: string;
    response: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}