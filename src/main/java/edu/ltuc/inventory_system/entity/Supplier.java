package edu.ltuc.inventory_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "suppliers")
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String phone;

    private String email;

    private String address;
}
