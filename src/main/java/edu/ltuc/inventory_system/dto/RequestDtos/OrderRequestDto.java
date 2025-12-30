package edu.ltuc.inventory_system.dto.RequestDtos;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record OrderRequestDto(

        @NotEmpty(message = "Order items cannot be empty")
        List<OrderItemRequestDto> items

) {
}
