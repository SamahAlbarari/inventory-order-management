package edu.ltuc.inventory_system.entity;

import edu.ltuc.inventory_system.enums.OrderStatus;
import edu.ltuc.inventory_system.security.Entity.SystemUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private SystemUser systemUser;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;

    @Column(nullable = false, name = "total_price")
    private double totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false, unique = true, name = "payment_reference")
    private UUID paymentReference;

    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt;
}
