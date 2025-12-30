package edu.ltuc.inventory_system.dto.AdminDtos;

public record InventoryStatsDto(

        long totalProducts,
        long activeProducts,
        long inactiveProducts,
        long lowStockProducts,
        long outOfStockProducts

) {
}
