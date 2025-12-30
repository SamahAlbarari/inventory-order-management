package edu.ltuc.inventory_system.Exceptions;

public class RoleExistException extends RuntimeException {
    public RoleExistException(String message) {
        super(message);
    }
}
