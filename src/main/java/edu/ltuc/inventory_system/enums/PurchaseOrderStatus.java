package edu.ltuc.inventory_system.enums;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Set;

public enum PurchaseOrderStatus {

    PENDING,
    RECEIVED,
    CANCELLED;

    private static final EnumMap<PurchaseOrderStatus, Set<PurchaseOrderStatus>> allowedTransition = new EnumMap<>(PurchaseOrderStatus.class);

    static {
        allowedTransition.put(PENDING, EnumSet.of(RECEIVED, CANCELLED));
        allowedTransition.put(RECEIVED, EnumSet.noneOf(PurchaseOrderStatus.class));
        allowedTransition.put(CANCELLED, EnumSet.noneOf(PurchaseOrderStatus.class));
    }

    public boolean canBeTransTo(PurchaseOrderStatus newStatus) {
        return allowedTransition.get(this).contains(newStatus);
    }

}
