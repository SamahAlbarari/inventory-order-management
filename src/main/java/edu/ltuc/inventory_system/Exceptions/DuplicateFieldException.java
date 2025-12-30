package edu.ltuc.inventory_system.Exceptions;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Used when more than one unique field is duplicated.
 * Carries the offending fields so the frontend can highlight them precisely.
 */
public class DuplicateFieldException extends RuntimeException {

    private final Set<String> fields;

    public DuplicateFieldException(String message, Set<String> fields) {
        super(message);
        this.fields = fields == null ? Collections.emptySet() : new LinkedHashSet<>(fields);
    }

    public Set<String> getFields() {
        return Collections.unmodifiableSet(fields);
    }
}
