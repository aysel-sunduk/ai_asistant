import type { Contact } from '../models/contact.model';
import apiClient from './client';

export const contactsApi = {
    getContacts: () => apiClient.get<Contact[]>('/contacts'),
    getContact: (id: string) => apiClient.get<Contact>(`/contacts/${id}`),
    createContact: (data: Partial<Contact>) => apiClient.post<Contact>('/contacts', data),
    updateContact: (id: string, data: Partial<Contact>) => apiClient.put<Contact>(`/contacts/${id}`, data),
    deleteContact: (id: string) => apiClient.delete(`/contacts/${id}`),
};
