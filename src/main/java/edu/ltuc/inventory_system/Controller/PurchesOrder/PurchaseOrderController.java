package edu.ltuc.inventory_system.Controller.PurchesOrder;


import edu.ltuc.inventory_system.Config.DataProperties;
import edu.ltuc.inventory_system.Service.Interface.Purches.PurchaseOrderService;
import edu.ltuc.inventory_system.dto.RequestDtos.PurchaseOrderRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.PurchaseOrderResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final DataProperties dataProperties;

    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @PostMapping("/purchase-orders")
    public ResponseEntity<PurchaseOrderResponseDto> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequestDto purchaseOrderRequestDto) throws URISyntaxException {
        Long purchaseOrderId = purchaseOrderService.createPurchaseOrder(purchaseOrderRequestDto);
        return ResponseEntity.created(new URI(dataProperties.getBaseUrl() + "/api/purchase-orders/" + purchaseOrderId)).build();
    }

    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @GetMapping("/purchase-orders/{id}")
    public ResponseEntity<PurchaseOrderResponseDto> getPurchaseOrder(@PathVariable Long id) {
        PurchaseOrderResponseDto orderResponseDto = purchaseOrderService.getPurchaserOrder(id);
        return ResponseEntity.ok(orderResponseDto);
    }

    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @PostMapping("/purchase-orders/{id}/receive")
    public ResponseEntity<PurchaseOrderResponseDto> receivePurchaseOrder(@PathVariable Long id) {
        PurchaseOrderResponseDto purchaseOrderReceived = purchaseOrderService.receivePurchaseOrder(id);
        return ResponseEntity.ok(purchaseOrderReceived);
    }

    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @GetMapping("purchase-orders/manager/pending")
    public ResponseEntity<Page<PurchaseOrderResponseDto>> getPendingPurchaseOrders(Pageable pageable) {
        Page<PurchaseOrderResponseDto> pendingPurchaseOrders = purchaseOrderService.getPendingPurchaseOrders(pageable);
        return ResponseEntity.ok(pendingPurchaseOrders);
    }


}
