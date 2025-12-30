package edu.ltuc.inventory_system.dto.ResponseDtos;

public record PurchaseOrderItemResponseDto(

        Long id,
        ProductManagerResponseDto product,
        Integer quantity
) {
}
