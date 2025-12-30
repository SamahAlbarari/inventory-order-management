package edu.ltuc.inventory_system.dto.AdminDtos;

public record RevenueStatsDto(

        Double totalRevenue,
        Double todayRevenue,
        Double refundedAmount

) {
}
