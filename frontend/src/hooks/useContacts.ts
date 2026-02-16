import { useCallback } from 'react';
import { contactsService } from '../../services/contacts.service';
import type { Contact } from '../models/contact.model';
import { useContactsStore } from '../store/contacts.store';

export function useContacts() {
    const store = useContactsStore();

    const fetchContacts = useCallback(async () => {
        store.setLoading(true);
        try {
            const contacts = await contactsService.getAll();
            store.setContacts(contacts);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const createContact = useCallback(async (data: Partial<Contact>) => {
        const contact = await contactsService.create(data);
        store.addContact(contact);
        return contact;
    }, []);

    const updateContact = useCallback(async (id: string, data: Partial<Contact>) => {
        const contact = await contactsService.update(id, data);
        store.updateContact(contact);
        return contact;
    }, []);

    const deleteContact = useCallback(async (id: string) => {
        await contactsService.delete(id);
        store.removeContact(id);
    }, []);

    return {
        ...store,
        fetchContacts,
        createContact,
        updateContact,
        deleteContact,
    };
}
