package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PurchaseOrderRequestDto(

        @NotNull(message = "Supplier Id is required")
        Long supplierId,

        @NotEmpty(message = "Purchase order must contain at least one item")
        List<PurchaseOrderItemRequestDto> items

) {
}
