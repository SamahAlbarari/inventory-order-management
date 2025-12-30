package edu.ltuc.inventory_system.Exceptions;

public class InvalidPurchaseOrderStatusTransitionException extends RuntimeException {
    public InvalidPurchaseOrderStatusTransitionException(String message) {
        super(message);
    }
}
