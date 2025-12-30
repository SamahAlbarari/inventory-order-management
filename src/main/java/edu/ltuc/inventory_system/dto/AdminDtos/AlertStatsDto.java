package edu.ltuc.inventory_system.dto.AdminDtos;

public record AlertStatsDto(

        long lowStockAlerts,
        long outOfStockAlerts

) {
}
