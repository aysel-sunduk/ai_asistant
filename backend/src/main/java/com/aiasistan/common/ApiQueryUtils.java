/**
 * Kisa aciklama: Bu dosya modulin ortak parcasidir.
 */
package com.aiasistan.common;

import java.util.Set;

import org.springframework.data.domain.Sort;

public final class ApiQueryUtils {

    private ApiQueryUtils() {
    }

    public static Sort resolveSort(String sortBy, String sortDirection, Set<String> allowedFields, String defaultField) {
        String field = allowedFields.contains(sortBy) ? sortBy : defaultField;
        return "ASC".equalsIgnoreCase(sortDirection)
            ? Sort.by(field).ascending()
            : Sort.by(field).descending();
    }
}