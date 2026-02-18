import { contactsApi } from '../src/api/contacts.api';
import type { Contact, ContactPage, ContactRequest } from '../src/models/contact.model';

export const contactsService = {
    getAll: async (page = 0, size = 100): Promise<ContactPage> => {
        const response = await contactsApi.getContacts(page, size);
        return response.data.data;
    },

    getById: async (id: string): Promise<Contact> => {
        const response = await contactsApi.getContact(id);
        return response.data.data;
    },

    create: async (data: ContactRequest): Promise<Contact> => {
        const response = await contactsApi.createContact(data);
        return response.data.data;
    },

    update: async (id: string, data: ContactRequest): Promise<Contact> => {
        const response = await contactsApi.updateContact(id, data);
        return response.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await contactsApi.deleteContact(id);
    },
};
