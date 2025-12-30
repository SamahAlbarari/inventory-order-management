package edu.ltuc.inventory_system.entity;

import edu.ltuc.inventory_system.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "products")
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private double price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(nullable = false)
    private Integer stock;

    @Column(nullable = false, name = "min_stock")
    private Integer minStock;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status;

}
