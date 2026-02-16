import { contactsApi } from '../src/api/contacts.api';
import type { Contact } from '../src/models/contact.model';

export const contactsService = {
    getAll: async (): Promise<Contact[]> => {
        const response = await contactsApi.getAll();
        return response.data;
    },

    getById: async (id: string): Promise<Contact> => {
        const response = await contactsApi.getById(id);
        return response.data;
    },

    create: async (data: Partial<Contact>): Promise<Contact> => {
        const response = await contactsApi.create(data);
        return response.data;
    },

    update: async (id: string, data: Partial<Contact>): Promise<Contact> => {
        const response = await contactsApi.update(id, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await contactsApi.delete(id);
    },
};
