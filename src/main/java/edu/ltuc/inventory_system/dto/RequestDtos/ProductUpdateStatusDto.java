package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.NotBlank;

public record ProductUpdateStatusDto(

        @NotBlank(message = "status is required")
        String status
) {
}
