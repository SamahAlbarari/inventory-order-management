package edu.ltuc.inventory_system.Controller.Admin;

import edu.ltuc.inventory_system.Service.Interface.Admin.AdminOverviewService;
import edu.ltuc.inventory_system.dto.AdminDtos.AdminOverviewDto;
import edu.ltuc.inventory_system.dto.RequestDtos.ResetPasswordRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.GenericMessageDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.UserResponseDto;
import edu.ltuc.inventory_system.security.Service.Interface.User.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api")
@RequiredArgsConstructor
@RestController
public class AdminController {

    private final AdminOverviewService adminOverviewService;
    private final UserService userService;

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/admin/overview")
    public ResponseEntity<AdminOverviewDto> getOverview() {
        return ResponseEntity.ok(adminOverviewService.getOverview());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/admin/users")
    public ResponseEntity<Page<UserResponseDto>> getAllUsers(Pageable pageable) {
        Page<UserResponseDto> allUsers = userService.getAllUsers(pageable);
        return ResponseEntity.ok(allUsers);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/admin/users/{userId}/password")
    public ResponseEntity<GenericMessageDto> resetUserPassword(
            @PathVariable Long userId,
            @Valid @RequestBody ResetPasswordRequestDto dto
    ) {
        userService.resetPassword(userId, dto.password());
        return ResponseEntity.ok(new GenericMessageDto("Password reset successfully"));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("admin/managers")
    public ResponseEntity<List<UserResponseDto>> getAllManager() {
        List<UserResponseDto> allManagers = userService.getAllManagers();
        return ResponseEntity.ok(allManagers);
    }

    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @GetMapping("manager/users")
    public ResponseEntity<Page<UserResponseDto>> getAllCustomer(Pageable pageable) {
        Page<UserResponseDto> allCustomers = userService.getAllCustomer(pageable);
        return ResponseEntity.ok(allCustomers);
    }
}
