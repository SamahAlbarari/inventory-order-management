package edu.ltuc.inventory_system.dto.AdminDtos;

public record SupplierStatsDto(

        long totalSuppliers,
        long pendingPurchaseOrders,
        long receivedPurchaseOrders

) {
}
