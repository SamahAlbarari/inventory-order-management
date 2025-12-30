package edu.ltuc.inventory_system.dto.AdminDtos;

public record OrderStatsDto(

        long totalOrders,
        long confirmedOrders,
        long cancelledOrders,
        long deliveredOrders,
        long todayOrders

) {
}
