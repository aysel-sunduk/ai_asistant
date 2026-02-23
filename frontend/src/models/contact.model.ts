// Kisa aciklama: Destekleyici modul kodu icerir.
export interface Contact {
    id: string;
    name: string;
    relationship?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ContactRequest {
    name: string;
    relationship?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    notes?: string;
}

export interface ContactPage {
    content: Contact[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}