package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.NotBlank;

public record RequestRoleDto(

        @NotBlank(message = "role name is Required")
        String name
) {
}
