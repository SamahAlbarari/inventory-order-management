package edu.ltuc.inventory_system.enums;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Set;

public enum OrderStatus {

    PENDING, CONFIRMED, DELIVERED, CANCELLED;

    private static final EnumMap<OrderStatus, Set<OrderStatus>>
            allowedTransition = new EnumMap<>(OrderStatus.class);

    static {
        allowedTransition.put(PENDING, EnumSet.of(CONFIRMED, CANCELLED));
        allowedTransition.put(CONFIRMED, EnumSet.of(DELIVERED, CANCELLED));
        allowedTransition.put(DELIVERED, EnumSet.noneOf(OrderStatus.class));
        allowedTransition.put(CANCELLED, EnumSet.noneOf(OrderStatus.class));
    }

    public boolean canBeTransTo(OrderStatus newStatus) {
        return allowedTransition.get(this).contains(newStatus);
    }
}