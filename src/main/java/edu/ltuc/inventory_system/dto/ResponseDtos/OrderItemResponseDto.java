package edu.ltuc.inventory_system.dto.ResponseDtos;


public record OrderItemResponseDto(

        Long productId,
        String productName,
        double unitPrice,
        int quantity,
        double subTotal
) {
}
