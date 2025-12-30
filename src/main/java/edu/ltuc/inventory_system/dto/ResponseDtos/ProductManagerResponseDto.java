package edu.ltuc.inventory_system.dto.ResponseDtos;

import edu.ltuc.inventory_system.enums.ProductStatus;


public record ProductManagerResponseDto(

        Long id,
        String name,
        String supplierName,
        Double price,
        Integer stock,
        Integer minStock,
        ProductStatus status,
        Integer reOrderQuantity
) {
}
