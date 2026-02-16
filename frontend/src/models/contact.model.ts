export interface Contact {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    relationship?: string;
    birthDate?: string;
    avatarUrl?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
