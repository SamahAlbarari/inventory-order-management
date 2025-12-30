package edu.ltuc.inventory_system.security.Service.Implementation.Role;

import edu.ltuc.inventory_system.Exceptions.RoleExistException;
import edu.ltuc.inventory_system.Exceptions.RoleNotFoundException;
import edu.ltuc.inventory_system.Exceptions.UserNotFoundException;
import edu.ltuc.inventory_system.Mapper.EntityMapper;
import edu.ltuc.inventory_system.dto.RequestDtos.RequestRoleDto;
import edu.ltuc.inventory_system.dto.RequestDtos.UpdateUserRolesRequest;
import edu.ltuc.inventory_system.dto.ResponseDtos.RoleResponseDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.UserResponseDto;
import edu.ltuc.inventory_system.security.Entity.Role;
import edu.ltuc.inventory_system.security.Entity.SystemUser;
import edu.ltuc.inventory_system.security.Repository.RoleRepository;
import edu.ltuc.inventory_system.security.Repository.UserRepository;
import edu.ltuc.inventory_system.security.Service.Interface.Role.RoleService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleServiceImplementation implements RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final EntityMapper entityMapper = EntityMapper.INSTANCE;

    @Override
    public List<RoleResponseDto> getAllRoles() {
        return roleRepository.findAll().stream().map(entityMapper::toRoleResponseDto).toList();
    }

    @Override
    @Transactional
    public RoleResponseDto addRole(RequestRoleDto role) {
        roleRepository.findByName(role.name()).ifPresent(roleVal -> {
            throw new RoleExistException("Role By Role Name " + roleVal.getName() + " is Exist ");
        });

        Role toRole = entityMapper.toRole(role);

        Role savedRole = roleRepository.save(toRole);

        return entityMapper.toRoleResponseDto(savedRole);
    }

    @Transactional
    public UserResponseDto updateRole(Long userId, UpdateUserRolesRequest request) {

        SystemUser user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (request.addRoleIds() != null) {
            for (Long roleId : request.addRoleIds()) {
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new RoleNotFoundException("Role not found : " + roleId));
                user.getRoles().add(role);
            }
        }

        if (request.removeRoleIds() != null) {
            for (Long roleId : request.removeRoleIds()) {
                user.getRoles().removeIf(r -> r.getId().equals(roleId));
            }
        }
        userRepository.save(user);
        return entityMapper.toUserResponseDto(user);
    }

    @Override
    @Transactional
    public void deleteRole(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RoleNotFoundException("Role not found : " + roleId));

        // Prevent deleting core roles used by the system
        String name = String.valueOf(role.getName()).toUpperCase();
        if (name.equals("ADMIN") || name.equals("STORE_MANAGER") || name.equals("CUSTOMER")) {
            throw new RoleExistException("Cannot delete core role: " + role.getName());
        }

        // Remove links from join table first to avoid FK constraint errors
        roleRepository.deleteUserRoleLinks(roleId);
        roleRepository.deleteById(roleId);
    }
}
