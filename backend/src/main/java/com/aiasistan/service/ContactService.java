package com.aiasistan.service;

import com.aiasistan.dto.request.ContactRequest;
import com.aiasistan.dto.response.ContactResponse;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.Contact;
import com.aiasistan.repository.ContactRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserService userService;

    public ContactService(ContactRepository contactRepository, UserService userService) {
        this.contactRepository = contactRepository;
        this.userService = userService;
    }

    @Transactional
    public ContactResponse createContact(String userEmail, ContactRequest request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Contact contact = new Contact();
        contact.setUserId(userId);
        apply(contact, request);
        return toResponse(contactRepository.save(contact));
    }

    @Transactional(readOnly = true)
    public Page<ContactResponse> getContacts(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        return contactRepository.findByUserIdOrderByNameAsc(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ContactResponse getContact(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Contact contact = contactRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Contact not found"));
        return toResponse(contact);
    }

    @Transactional
    public ContactResponse updateContact(String userEmail, UUID id, ContactRequest request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Contact contact = contactRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Contact not found"));
        apply(contact, request);
        return toResponse(contactRepository.save(contact));
    }

    @Transactional
    public void deleteContact(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Contact contact = contactRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Contact not found"));
        contactRepository.delete(contact);
    }

    private void apply(Contact contact, ContactRequest request) {
        contact.setName(request.getName());
        contact.setRelationship(request.getRelationship());
        contact.setBirthDate(request.getBirthDate());
        contact.setPhone(request.getPhone());
        contact.setEmail(request.getEmail());
        contact.setNotes(request.getNotes());
    }

    private ContactResponse toResponse(Contact contact) {
        ContactResponse response = new ContactResponse();
        response.setId(contact.getId());
        response.setName(contact.getName());
        response.setRelationship(contact.getRelationship());
        response.setBirthDate(contact.getBirthDate());
        response.setPhone(contact.getPhone());
        response.setEmail(contact.getEmail());
        response.setNotes(contact.getNotes());
        response.setCreatedAt(contact.getCreatedAt());
        response.setUpdatedAt(contact.getUpdatedAt());
        return response;
    }
}
