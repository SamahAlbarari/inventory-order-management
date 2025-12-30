package edu.ltuc.inventory_system.enums;

import java.util.Arrays;

public enum ProductStatus {

    ACTIVE,
    INACTIVE;

    public static boolean contain(String status) {
        return Arrays.stream(ProductStatus.values())
                .anyMatch(s -> s.name().equalsIgnoreCase(status));
    }

}
