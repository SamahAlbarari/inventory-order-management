package edu.ltuc.inventory_system.Controller.Admin;

import edu.ltuc.inventory_system.dto.RequestDtos.RequestRoleDto;
import edu.ltuc.inventory_system.dto.RequestDtos.UpdateUserRolesRequest;
import edu.ltuc.inventory_system.dto.ResponseDtos.RoleResponseDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.UserResponseDto;
import edu.ltuc.inventory_system.security.Service.Interface.Role.RoleService;
import edu.ltuc.inventory_system.security.Service.Interface.User.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;
    private final UserService userService;

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/roles")
    public ResponseEntity<RoleResponseDto> addRole(@RequestBody @Valid RequestRoleDto requestRoleDto) {
        RoleResponseDto role = roleService.addRole(requestRoleDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(role);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/roles")
    public ResponseEntity<List<RoleResponseDto>> getAllRoles() {
        List<RoleResponseDto> roles = roleService.getAllRoles();
        return ResponseEntity.ok(roles);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("roles/{userId}")
    public ResponseEntity<UserResponseDto> updateUserRoles(
            @PathVariable Long userId,
            @RequestBody UpdateUserRolesRequest request) {
        UserResponseDto updatedUser = roleService.updateRole(userId, request);
        return ResponseEntity.ok(updatedUser);
    }

}
