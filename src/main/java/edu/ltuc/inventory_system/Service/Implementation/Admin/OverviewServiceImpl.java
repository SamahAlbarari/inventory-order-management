package edu.ltuc.inventory_system.Service.Implementation.Admin;

import edu.ltuc.inventory_system.dto.AdminDtos.*;
import edu.ltuc.inventory_system.enums.OrderStatus;
import edu.ltuc.inventory_system.enums.ProductStatus;
import edu.ltuc.inventory_system.enums.PurchaseOrderStatus;
import edu.ltuc.inventory_system.Repository.Order.OrderRepository;
import edu.ltuc.inventory_system.Repository.Product.ProductRepository;
import edu.ltuc.inventory_system.Repository.Product.SupplierRepository;
import edu.ltuc.inventory_system.Repository.Purchase.PurchaseOrderRepository;
import edu.ltuc.inventory_system.security.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OverviewServiceImpl implements edu.ltuc.inventory_system.Service.Interface.Admin.AdminOverviewService {


    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @Override
    public AdminOverviewDto getOverview() {


        UsersStatsDto users = new UsersStatsDto(
                userRepository.count(),
                userRepository.countByRoles_Name("CUSTOMER"),
                userRepository.countByRoles_Name("STORE_MANAGER"),
                userRepository.countByRoles_Name("ADMIN")
        );

        InventoryStatsDto inventory = new InventoryStatsDto(
                productRepository.count(),
                productRepository.countByStatus(ProductStatus.ACTIVE),
                productRepository.countByStatus(ProductStatus.INACTIVE),
                productRepository.countLowStock(),
                productRepository.countOutOfStock()
        );

        OrderStatsDto orders = new OrderStatsDto(
                orderRepository.count(),
                orderRepository.countByStatus(OrderStatus.CONFIRMED),
                orderRepository.countByStatus(OrderStatus.CANCELLED),
                orderRepository.countByStatus(OrderStatus.DELIVERED),
                orderRepository.countTodayOrders()
        );

        RevenueStatsDto revenue = new RevenueStatsDto(
                orderRepository.sumTotalRevenue(),
                orderRepository.sumTodayRevenue(),
                orderRepository.sumRefundedAmount()
        );

        SupplierStatsDto suppliers = new SupplierStatsDto(
                supplierRepository.count(),
                purchaseOrderRepository.countByStatus(PurchaseOrderStatus.PENDING),
                purchaseOrderRepository.countByStatus(PurchaseOrderStatus.RECEIVED)
        );

        AlertStatsDto alerts = new AlertStatsDto(
                productRepository.countLowStock(),
                productRepository.countOutOfStock()
        );
        return new AdminOverviewDto(
                users,
                inventory,
                orders,
                revenue,
                suppliers,
                alerts
        );
    }
}
