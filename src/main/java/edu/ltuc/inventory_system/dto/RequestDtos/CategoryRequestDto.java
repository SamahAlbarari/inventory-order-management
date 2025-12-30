package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequestDto(

        @NotBlank(message = "Category name is Required ")
        String name,

        @Size(max = 1000, message = "Description must not exceed 1000 characters")
        String description
) {
}
