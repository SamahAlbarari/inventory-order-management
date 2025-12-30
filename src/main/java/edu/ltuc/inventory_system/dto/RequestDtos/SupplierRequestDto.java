package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SupplierRequestDto(

        @NotBlank(message = " name is Required ")
        String name,

        @Pattern(regexp = "\\+?\\d{10,15}", message = "Phone number is invalid")
        String phone,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email address")
        String email,

        String address
) {
}
