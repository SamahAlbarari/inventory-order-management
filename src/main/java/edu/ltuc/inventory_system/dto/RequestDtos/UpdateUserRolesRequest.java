package edu.ltuc.inventory_system.dto.RequestDtos;

import java.util.Set;

public record UpdateUserRolesRequest(

        Set<Long> addRoleIds,
        Set<Long> removeRoleIds
) {
}
