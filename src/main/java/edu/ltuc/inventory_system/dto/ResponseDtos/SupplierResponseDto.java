package edu.ltuc.inventory_system.dto.ResponseDtos;

public record SupplierResponseDto(

        Long id,
        String name,
        String phone,
        String email,
        String address
) {
}
