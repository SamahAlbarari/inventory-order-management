package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PurchaseOrderItemRequestDto(

        @NotNull(message = "purchase Order Id is required")
        Long purchaseOrderId,

        @NotNull(message = "Product Id is required")
        Long productId,

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be more than or equal 1 ")
        Integer quantity
) {
}
