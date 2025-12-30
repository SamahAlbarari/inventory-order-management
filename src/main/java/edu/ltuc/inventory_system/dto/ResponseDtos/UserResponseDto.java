package edu.ltuc.inventory_system.dto.ResponseDtos;

import edu.ltuc.inventory_system.security.Entity.Role;

import java.util.Set;

public record UserResponseDto(

        Long id,
        String fullName,
        String email,
        Set<Role> roles
) {
}
