package edu.ltuc.inventory_system.Exceptions;

public class InvalidProductStatusException extends RuntimeException {
    public InvalidProductStatusException(String message) {
        super(message);
    }
}
