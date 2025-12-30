package edu.ltuc.inventory_system.Repository.Purchase;

import edu.ltuc.inventory_system.entity.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface PurchaseItemRepository extends JpaRepository<PurchaseOrderItem,Long> {

}
