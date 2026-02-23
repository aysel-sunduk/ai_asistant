// Kisa aciklama: Uygulama state yonetimini yapar.
import { create } from 'zustand';
import type { Contact } from '../models/contact.model';

interface ContactsState {
    contacts: Contact[];
    selectedContact: Contact | null;
    isLoading: boolean;

    setContacts: (contacts: Contact[]) => void;
    setSelectedContact: (contact: Contact | null) => void;
    addContact: (contact: Contact) => void;
    updateContact: (contact: Contact) => void;
    removeContact: (id: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
    contacts: [],
    selectedContact: null,
    isLoading: false,

    setContacts: (contacts) => set({ contacts }),
    setSelectedContact: (selectedContact) => set({ selectedContact }),
    addContact: (contact) =>
        set((state) => ({ contacts: [contact, ...state.contacts] })),
    updateContact: (contact) =>
        set((state) => ({
            contacts: state.contacts.map((c) => (c.id === contact.id ? contact : c)),
        })),
    removeContact: (id) =>
        set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) })),
    setLoading: (isLoading) => set({ isLoading }),
}));