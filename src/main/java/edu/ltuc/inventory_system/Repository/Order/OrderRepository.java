package edu.ltuc.inventory_system.Repository.Order;

import edu.ltuc.inventory_system.entity.Order;
import edu.ltuc.inventory_system.security.Entity.SystemUser;
import edu.ltuc.inventory_system.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findBySystemUser_IdOrderByCreatedAtDesc(Long systemUserId, Pageable pageable);

    Long countByStatus(OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o " +
            "WHERE FUNCTION('DATE', o.createdAt) = CURRENT_DATE")
    Long countTodayOrders();

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0.0) FROM Order o WHERE o.status != 'CANCELLED'")
    Double sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0.0) FROM Order o " +
            "WHERE FUNCTION('DATE', o.createdAt) = CURRENT_DATE AND o.status != 'CANCELLED'")
    Double sumTodayRevenue();

    @Query("select coalesce(sum(o.totalPrice),0) from Order o where o.status = 'CANCELLED'")
    Double sumRefundedAmount();

    List<Order> findTop10ByOrderByCreatedAtDesc();

}
