package edu.ltuc.inventory_system.Service.Interface.Order;

import edu.ltuc.inventory_system.dto.RequestDtos.OrderRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.OrderResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;


public interface OrderService {

    Long createOrder(OrderRequestDto orderRequestDto);

    OrderResponseDto cancelOrder(Long id);

    OrderResponseDto getOrder(Long id);

    Page<OrderResponseDto> getAllOrdersByCustomer(Pageable pageable);

    List<OrderResponseDto> getRecentOrders();
}
