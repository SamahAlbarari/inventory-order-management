package edu.ltuc.inventory_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "purchase_order_items")
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class PurchaseOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "purchase_order_item_seq")
    @SequenceGenerator(name = "purchase_order_item_seq", allocationSize = 50, sequenceName = "purchase_order_item_seq")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id")
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;
}
