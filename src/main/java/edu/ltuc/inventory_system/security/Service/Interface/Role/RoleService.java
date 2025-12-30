package edu.ltuc.inventory_system.security.Service.Interface.Role;


import edu.ltuc.inventory_system.dto.RequestDtos.RequestRoleDto;
import edu.ltuc.inventory_system.dto.RequestDtos.UpdateUserRolesRequest;
import edu.ltuc.inventory_system.dto.ResponseDtos.RoleResponseDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.UserResponseDto;

import java.util.List;

public interface RoleService {

    List<RoleResponseDto> getAllRoles();

    RoleResponseDto addRole(RequestRoleDto role);

    UserResponseDto updateRole(Long userId, UpdateUserRolesRequest request);

    void deleteRole(Long roleId);
}
