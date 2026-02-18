export interface FamilyBirthdayRequest {
    fullName: string;
    relationship?: string;
    birthDate: string; // YYYY-MM-DD
    phone?: string;
    email?: string;
    note?: string;
}

export interface FamilyBirthdayResponse {
    id: string;
    fullName: string;
    relationship?: string;
    birthDate: string;
    phone?: string;
    email?: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FamilyBirthdayPage {
    content: FamilyBirthdayResponse[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}
