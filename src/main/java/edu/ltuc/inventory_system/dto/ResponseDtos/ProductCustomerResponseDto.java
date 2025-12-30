package edu.ltuc.inventory_system.dto.ResponseDtos;

import edu.ltuc.inventory_system.enums.ProductStatus;
import edu.ltuc.inventory_system.enums.StockStatus;

public record ProductCustomerResponseDto(

        Long id,
        String name,
        String description,
        Double price,
        StockStatus stockStatus,
        ProductStatus status
) {
}
