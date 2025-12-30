package edu.ltuc.inventory_system.Service.Implementation.Order;

import edu.ltuc.inventory_system.Exceptions.*;
import edu.ltuc.inventory_system.Mapper.EntityMapper;
import edu.ltuc.inventory_system.Service.Interface.Order.OrderService;
import edu.ltuc.inventory_system.dto.RequestDtos.OrderItemRequestDto;
import edu.ltuc.inventory_system.dto.RequestDtos.OrderRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.OrderResponseDto;
import edu.ltuc.inventory_system.entity.Order;
import edu.ltuc.inventory_system.entity.OrderItem;
import edu.ltuc.inventory_system.entity.Product;
import edu.ltuc.inventory_system.enums.OrderStatus;
import edu.ltuc.inventory_system.Repository.Order.OrderRepository;
import edu.ltuc.inventory_system.Repository.Product.ProductRepository;
import edu.ltuc.inventory_system.security.Entity.Role;
import edu.ltuc.inventory_system.security.Entity.SystemUser;
import edu.ltuc.inventory_system.security.Repository.RoleRepository;
import edu.ltuc.inventory_system.security.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EntityMapper entityMapper = EntityMapper.INSTANCE;


    @Transactional
    public Long createOrder(OrderRequestDto orderRequestDto) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String userAuth = authentication.getName();

        SystemUser user = userRepository.findByEmailIgnoreCase(userAuth)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Order order = new Order();
        order.setSystemUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());
        order.setPaymentReference(UUID.randomUUID());

        List<OrderItem> orderItems = new ArrayList<>();
        double totalPrice = 0.0;

        for (OrderItemRequestDto Item : orderRequestDto.items()) {

            Product product = productRepository.findById(Item.productId()).orElseThrow(() ->
                    new ProductNotFoundException("Product By Id " + Item.productId() + " is Not Found"));

            if (Item.quantity() > product.getStock()) {
                throw new
                        InvalidStockException("The requested quantity is not available for Product : " + product.getName());
            }

            double subTotal = product.getPrice() * Item.quantity();

            product.setStock(product.getStock() - Item.quantity());

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(Item.quantity());
            orderItem.setUnitPrice(product.getPrice());
            orderItem.setSubTotal(subTotal);

            orderItems.add(orderItem);

            totalPrice += subTotal;
        }

        order.setItems(orderItems);
        order.setTotalPrice(totalPrice);
        order.setStatus(OrderStatus.CONFIRMED);

        Order savedOrder = orderRepository.save(order);

        OrderResponseDto orderResponseDto = entityMapper.toOrderResponseDto(savedOrder);

        return orderResponseDto.id();
    }


    @Transactional
    public OrderResponseDto cancelOrder(Long id) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String userAuth = authentication.getName();

        SystemUser user = userRepository.findByEmailIgnoreCase(userAuth)
                .orElseThrow(() -> new UserNotFoundException("User not found"));


        Order order = orderRepository.findById(id).orElseThrow(() ->
                new OrderNotFoundException("Order with Id " + id + " is Not Found "));


        Set<Role> roles = user.getRoles();

        boolean isStoreManager = roles.stream().anyMatch(
                role -> role.getName().equals("STORE_MANAGER")
        );

        boolean isCustomer = roles.stream().anyMatch(
                role -> role.getName().equals("CUSTOMER")
        );

        boolean canCanceled = order.getStatus().canBeTransTo(OrderStatus.CANCELLED);
        if (isStoreManager) {
            order.setStatus(OrderStatus.CANCELLED);

            for (OrderItem orderItem : order.getItems()) {
                Product product = productRepository.findById(orderItem.getProduct().getId()).orElseThrow(() ->
                        new ProductNotFoundException("product by Id " + orderItem.getProduct().getId() + " Not Found "));
                Integer quantity = orderItem.getQuantity();
                product.setStock(product.getStock() + quantity);
                productRepository.save(product);
            }

        } else if (isCustomer) {

            if (!order.getSystemUser().getId().equals(user.getId())) {
                throw new AccessFauilerException("You can only cancel your own orders");
            }
            if (canCanceled) {
                order.setStatus(OrderStatus.CANCELLED);
                for (OrderItem orderItem : order.getItems()) {
                    Product product = productRepository.findById(orderItem.getProduct().getId())
                            .orElseThrow(() ->
                                    new ProductNotFoundException("product by Id " + orderItem.getProduct().getId()
                                            + " Not Found "));
                    Integer quantity = orderItem.getQuantity();
                    product.setStock(product.getStock() + quantity);
                    productRepository.save(product);
                }
            } else {
                throw new InvalidOrderStatusTransitionException("Cannot cancel order at current status");
            }
        } else {
            throw new AccessFauilerException("You do not have permission to cancel this order");
        }

        Order savedOrder = orderRepository.save(order);

        return entityMapper.toOrderResponseDto(savedOrder);
    }


    @Override
    public OrderResponseDto getOrder(Long id) {
        Order order = orderRepository.findById(id).orElseThrow(() ->
                new OrderNotFoundException("Order By Id " + id + " is Not Found"));
        return entityMapper.toOrderResponseDto(order);
    }


    @Override
    public Page<OrderResponseDto> getAllOrdersByCustomer(Pageable pageable) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        SystemUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UserNotFoundException("User Not Found "));

        Page<Order> ordersPage =
                orderRepository.findBySystemUser_IdOrderByCreatedAtDesc
                        (user.getId(), pageable);

        return ordersPage.map(entityMapper::toOrderResponseDto);
    }

    @Override
    public List<OrderResponseDto> getRecentOrders() {
        List<Order> recentTop10 = orderRepository.findTop10ByOrderByCreatedAtDesc();
        return recentTop10.stream().map(entityMapper::toOrderResponseDto).toList();
    }


}