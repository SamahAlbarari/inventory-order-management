package edu.ltuc.inventory_system.Repository.Purchase;

import edu.ltuc.inventory_system.entity.PurchaseOrder;
import edu.ltuc.inventory_system.enums.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    Long countByStatus(PurchaseOrderStatus status);

    Page<PurchaseOrder> findByStatus(PurchaseOrderStatus status, Pageable pageable);
}
