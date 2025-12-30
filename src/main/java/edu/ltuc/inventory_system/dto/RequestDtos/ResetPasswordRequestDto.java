package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordRequestDto(

        @NotBlank(message = "Password is required")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,25}$",
                message = "Password must be 8-25 chars, include uppercase, lowercase, number and special character"
        )
        String password
) {
}
