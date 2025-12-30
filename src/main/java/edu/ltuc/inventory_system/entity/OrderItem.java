package edu.ltuc.inventory_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "Order_Item_Seq")
    @SequenceGenerator(name = "Order_Item_Seq", allocationSize = 50, sequenceName = "Order_Item_Seq")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, name = "unit_price")
    private double unitPrice;

    @Column(nullable = false, name = "sub_total")
    private double subTotal;
}
