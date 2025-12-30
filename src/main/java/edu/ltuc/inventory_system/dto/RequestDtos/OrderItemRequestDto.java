package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;


public record OrderItemRequestDto(
        @NotNull(message = "Product Id is Required")
        Long productId,

        @NotNull(message = "quantity is Required")
        @Min(value = 1, message = "quantity must be more than or equal  1")
        @Max(value = 50, message = "quantity must be less than or equal  50")
        Integer quantity
) {
}
