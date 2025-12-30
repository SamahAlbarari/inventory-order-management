package edu.ltuc.inventory_system.dto.AdminDtos;

public record AdminOverviewDto(

        UsersStatsDto users,
        InventoryStatsDto inventory,
        OrderStatsDto orders,
        RevenueStatsDto revenue,
        SupplierStatsDto suppliers,
        AlertStatsDto alerts

) {
}
