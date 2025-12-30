package edu.ltuc.inventory_system.dto.ResponseDtos;

import edu.ltuc.inventory_system.enums.PurchaseOrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record PurchaseOrderResponseDto(

        Long id,
        SupplierResponseDto supplier,
        PurchaseOrderStatus status,
        LocalDateTime createdAt,
        List<PurchaseOrderItemResponseDto> items
) {
}
