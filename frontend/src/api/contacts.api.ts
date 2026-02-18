import type { ApiResponse } from '../models/auth.model';
import type { Contact, ContactPage, ContactRequest } from '../models/contact.model';
import apiClient from './client';

const BASE_PATH = '/v1/family/contacts';

export const contactsApi = {
    getContacts: (page = 0, size = 100) =>
        apiClient.get<ApiResponse<ContactPage>>(BASE_PATH, { params: { page, size } }),
    getContact: (id: string) =>
        apiClient.get<ApiResponse<Contact>>(`${BASE_PATH}/${id}`),
    createContact: (data: ContactRequest) =>
        apiClient.post<ApiResponse<Contact>>(BASE_PATH, data),
    updateContact: (id: string, data: ContactRequest) =>
        apiClient.put<ApiResponse<Contact>>(`${BASE_PATH}/${id}`, data),
    deleteContact: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`${BASE_PATH}/${id}`),
};
