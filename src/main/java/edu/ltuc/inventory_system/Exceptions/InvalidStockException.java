package edu.ltuc.inventory_system.Exceptions;

public class InvalidStockException extends RuntimeException {
    public InvalidStockException(String message) {
        super(message);
    }
}
