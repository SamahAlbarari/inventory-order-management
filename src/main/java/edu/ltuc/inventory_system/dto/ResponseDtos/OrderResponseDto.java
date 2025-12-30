package edu.ltuc.inventory_system.dto.ResponseDtos;


import edu.ltuc.inventory_system.enums.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponseDto(

        Long id,
        Long userId,
        List<OrderItemResponseDto> items,
        double totalPrice,
        OrderStatus status,
        LocalDateTime createdAt,
        UUID paymentReference

) {
}
