package edu.ltuc.inventory_system.Exceptions;

public class CategoryIsExistException extends RuntimeException {
    public CategoryIsExistException(String message) {
        super(message);
    }
}
