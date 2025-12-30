package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.Builder;

@Builder
public record ProductUpdateRequestDto(

        @Positive(message = "Price must be positive")
        Double price,

        @Min(value = 0, message = "Minimum stock cannot be negative")
        Integer minStock,

        String status
) {
}