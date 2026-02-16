export interface User {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    roleId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface UserProfile {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    bio?: string;
    phone?: string;
    birthDate?: string;
    language: string;
    createdAt: string;
    updatedAt: string;
}
