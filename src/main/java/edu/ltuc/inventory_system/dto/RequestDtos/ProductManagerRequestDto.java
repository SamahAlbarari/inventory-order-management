package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ProductManagerRequestDto(

        @NotBlank(message = "Product name is Required")
        String name,

        String description,

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be positive")
        Double price,

        @NotNull(message = "Category Id is required")
        Long categoryId,

        @NotNull(message = "Supplier Id is required")
        Long supplierId,

        @NotNull(message = "Stock is required")
        @Min(value = 0, message = "Stock cannot be negative")
        Integer stock,

        @NotNull(message = "Minimum stock is required")
        @Min(value = 0, message = "Minimum stock cannot be negative")
        Integer minStock,

        @NotBlank(message = "Status is required")
        String status
) {
}
