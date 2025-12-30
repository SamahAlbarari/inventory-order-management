package edu.ltuc.inventory_system.Service.Implementation.Purchase;

import edu.ltuc.inventory_system.Exceptions.InvalidPurchaseOrderStatusTransitionException;
import edu.ltuc.inventory_system.Exceptions.ProductNotFoundException;
import edu.ltuc.inventory_system.Exceptions.PurchaseOrderNotFoundException;
import edu.ltuc.inventory_system.Exceptions.SupplierNotFoundException;
import edu.ltuc.inventory_system.Mapper.EntityMapper;
import edu.ltuc.inventory_system.Service.Interface.Purches.PurchaseOrderService;
import edu.ltuc.inventory_system.dto.RequestDtos.PurchaseOrderItemRequestDto;
import edu.ltuc.inventory_system.dto.RequestDtos.PurchaseOrderRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.PurchaseOrderResponseDto;
import edu.ltuc.inventory_system.entity.Product;
import edu.ltuc.inventory_system.entity.PurchaseOrder;
import edu.ltuc.inventory_system.entity.PurchaseOrderItem;
import edu.ltuc.inventory_system.entity.Supplier;
import edu.ltuc.inventory_system.enums.PurchaseOrderStatus;
import edu.ltuc.inventory_system.Repository.Product.ProductRepository;
import edu.ltuc.inventory_system.Repository.Product.SupplierRepository;
import edu.ltuc.inventory_system.Repository.Purchase.PurchaseOrderRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final EntityMapper entityMapper = EntityMapper.INSTANCE;

    @Transactional
    public Long createPurchaseOrder(PurchaseOrderRequestDto purchaseOrderRequestDto) {

        Supplier supplier = supplierRepository.findById(purchaseOrderRequestDto.supplierId()).orElseThrow(
                () -> new SupplierNotFoundException("Supplier by Id " + purchaseOrderRequestDto.supplierId()
                        + " is Not found"));

        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setItems(new ArrayList<>());
        purchaseOrder.setCreatedAt(LocalDateTime.now());
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING);
        purchaseOrder.setSupplier(supplier);


        for (PurchaseOrderItemRequestDto item : purchaseOrderRequestDto.items()) {
            Product product = productRepository.findById(item.productId()).orElseThrow(() ->
                    new ProductNotFoundException("Product By Id " + item.productId() + " is Not Found"));

            PurchaseOrderItem orderItem = new PurchaseOrderItem();
            orderItem.setProduct(product);
            orderItem.setPurchaseOrder(purchaseOrder);
            orderItem.setQuantity(item.quantity());
            purchaseOrder.getItems().add(orderItem);
        }

        PurchaseOrder savedPurchaseOrder = purchaseOrderRepository.save(purchaseOrder);
        PurchaseOrderResponseDto orderResponseDto = entityMapper.toPurchaseOrderResponseDto(savedPurchaseOrder);
        return orderResponseDto.id();
    }


    @Transactional
    public PurchaseOrderResponseDto receivePurchaseOrder(Long id) {

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id).orElseThrow(() ->
                new PurchaseOrderNotFoundException("Purchase order with ID " + id + " was not found."));

        boolean resultConvertStatus = purchaseOrder.getStatus().canBeTransTo(PurchaseOrderStatus.RECEIVED);

        if (!resultConvertStatus) {
            throw new InvalidPurchaseOrderStatusTransitionException
                    ("Cannot change status from " + purchaseOrder.getStatus() + " to RECEIVED"
                    );
        }
        purchaseOrder.setStatus(PurchaseOrderStatus.RECEIVED);

        for (PurchaseOrderItem purchaseOrderItem : purchaseOrder.getItems()) {
            Product product = productRepository.findById(purchaseOrderItem.getProduct().getId()).orElseThrow(() ->
                    new ProductNotFoundException("Product By Id " + purchaseOrderItem.getProduct().getId() + " is Not Found"));

            product.setStock(product.getStock() + purchaseOrderItem.getQuantity());
            productRepository.save(product);
        }

        return entityMapper.toPurchaseOrderResponseDto(purchaseOrder);
    }


    @Override
    public PurchaseOrderResponseDto getPurchaserOrder(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id).orElseThrow(() ->
                new PurchaseOrderNotFoundException("Purchase order with ID " + id + " was not found."));
        return entityMapper.toPurchaseOrderResponseDto(purchaseOrder);
    }

    @Override
    public Page<PurchaseOrderResponseDto> getPendingPurchaseOrders(Pageable pageable) {
        Page<PurchaseOrder> byStatus = purchaseOrderRepository.findByStatus(PurchaseOrderStatus.PENDING, pageable);
        return byStatus.map(entityMapper::toPurchaseOrderResponseDto);
    }
}
