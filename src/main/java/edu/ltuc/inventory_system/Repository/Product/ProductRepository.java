package edu.ltuc.inventory_system.Repository.Product;

import edu.ltuc.inventory_system.entity.Product;
import edu.ltuc.inventory_system.entity.Supplier;
import edu.ltuc.inventory_system.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByNameIgnoreCase(String name);


    @Query("""
            SELECT p FROM Product p
            WHERE (:categoryName IS NULL OR p.category.name = :categoryName)
            AND (:minPrice IS NULL OR p.price >= :minPrice)
            AND (:maxPrice IS NULL OR p.price <= :maxPrice)
            AND (:productName IS NULL OR p.name = :productName)
            """)
    Page<Product> findFilteredProducts(@Param("categoryName") String categoryName,
                                       @Param("minPrice") Double minPrice,
                                       @Param("maxPrice") Double maxPrice,
                                       @Param("productName") String productName,
                                       Pageable pageable);


    @Query("SELECT p FROM Product p WHERE p.stock <= p.minStock")
    List<Product> findLowStockProducts();

    Long countByStatus(ProductStatus status);

    @Query("select count(p) from Product p where p.stock <= p.minStock")
    Long countLowStock();

    @Query("select count(p) from Product p where p.stock = 0")
    Long countOutOfStock();

    @Query("select COALESCE(SUM(p.stock),0) from Product p ")
    Long getTotalStock();


}
