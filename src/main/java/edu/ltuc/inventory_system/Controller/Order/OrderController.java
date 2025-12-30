package edu.ltuc.inventory_system.Controller.Order;


import edu.ltuc.inventory_system.Config.DataProperties;
import edu.ltuc.inventory_system.Service.Interface.Order.OrderService;
import edu.ltuc.inventory_system.dto.RequestDtos.OrderRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.OrderResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final DataProperties dataProperties;


    @PreAuthorize("hasAuthority('CUSTOMER')")
    @GetMapping("/customer/orders")
    public ResponseEntity<Page<OrderResponseDto>> getAllOrdersByCustomer(
            @PageableDefault(sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OrderResponseDto> orders = orderService.getAllOrdersByCustomer(pageable);
        return ResponseEntity.ok(orders);
    }


    @PreAuthorize("hasAuthority('CUSTOMER')")
    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderResponseDto> getOrder(@PathVariable Long id) {
        OrderResponseDto orderResponseDto = orderService.getOrder(id);
        return ResponseEntity.ok(orderResponseDto);
    }


    @PreAuthorize("hasAuthority('CUSTOMER')")
    @PostMapping("/orders")
    public ResponseEntity<OrderResponseDto> createOrder(@Valid @RequestBody OrderRequestDto orderRequestDto) throws URISyntaxException {
        Long orderId = orderService.createOrder(orderRequestDto);
        return ResponseEntity.created(new URI(dataProperties.getBaseUrl() + "/api/orders/" + orderId)).build();
    }


    @PreAuthorize("hasAnyAuthority('CUSTOMER', 'STORE_MANAGER')")
    @DeleteMapping("/orders/{id}")
    public ResponseEntity<OrderResponseDto> cancelOrder(@PathVariable Long id) {
        OrderResponseDto orderResponseDto = orderService.cancelOrder(id);
        return ResponseEntity.ok(orderResponseDto);
    }

    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @GetMapping("/manager/orders/recent")
    public ResponseEntity<List<OrderResponseDto>> getRecentOrders() {
        List<OrderResponseDto> recentOrders = orderService.getRecentOrders();
        return ResponseEntity.ok(recentOrders);
    }


    // Store managers need to view order details for recent orders.
    // We expose a manager-scoped endpoint so we don't change the CUSTOMER-only /orders/{id} route.
    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @GetMapping("/manager/orders/{id}")
    public ResponseEntity<OrderResponseDto> getOrderForManager(@PathVariable Long id) {
        OrderResponseDto orderResponseDto = orderService.getOrder(id);
        return ResponseEntity.ok(orderResponseDto);
    }


}
