package edu.ltuc.inventory_system.Service.Interface.Purches;

import edu.ltuc.inventory_system.dto.RequestDtos.PurchaseOrderRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.PurchaseOrderResponseDto;
import edu.ltuc.inventory_system.enums.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PurchaseOrderService {

    Long createPurchaseOrder(PurchaseOrderRequestDto purchaseOrderRequestDto);

    PurchaseOrderResponseDto receivePurchaseOrder(Long id);

    PurchaseOrderResponseDto getPurchaserOrder(Long id);

    Page<PurchaseOrderResponseDto> getPendingPurchaseOrders(Pageable pageable);
}
