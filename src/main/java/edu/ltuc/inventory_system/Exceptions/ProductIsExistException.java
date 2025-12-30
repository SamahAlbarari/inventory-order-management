package edu.ltuc.inventory_system.Exceptions;

public class ProductIsExistException extends RuntimeException {
    public ProductIsExistException(String message) {
        super(message);
    }
}
