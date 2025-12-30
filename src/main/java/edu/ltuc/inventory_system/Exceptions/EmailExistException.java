package edu.ltuc.inventory_system.Exceptions;

public class EmailExistException extends RuntimeException {
    public EmailExistException(String message) {
        super(message);
    }
}
