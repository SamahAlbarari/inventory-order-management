package edu.ltuc.inventory_system.Mapper;

import edu.ltuc.inventory_system.dto.RequestDtos.*;
import edu.ltuc.inventory_system.dto.ResponseDtos.*;
import edu.ltuc.inventory_system.entity.*;
import edu.ltuc.inventory_system.enums.ProductStatus;
import edu.ltuc.inventory_system.security.Entity.Role;
import edu.ltuc.inventory_system.security.Entity.SystemUser;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;

@Mapper
public interface EntityMapper {

    EntityMapper INSTANCE = Mappers.getMapper(EntityMapper.class);

    Category toCategory(CategoryRequestDto categoryRequestDto);

    CategoryResponseDto toCategoryResponseDto(Category category);

    Supplier toSupplier(SupplierRequestDto supplierRequestDto);

    SupplierResponseDto toSupplierResponseDto(Supplier supplier);

    @Mapping(source = "status", target = "status", qualifiedByName = "mapStatus")
    Product toProduct(ProductUpdateRequestDto productUpdateRequestDto);


    ProductCustomerResponseDto toProductCustomerResponseDto(Product product);


    @Mapping(source = "categoryId", target = "category.id")
    @Mapping(source = "supplierId", target = "supplier.id")
    @Mapping(source = "status", target = "status", qualifiedByName = "mapStatus")
    Product toProduct(ProductManagerRequestDto productRequestDto);

    @Named("mapStatus")
    default ProductStatus mapStatus(String status) {
        return ProductStatus.valueOf(status.toUpperCase());
    }


    @Mapping(source = "supplier.name", target = "supplierName")
    @Mapping(target = "reOrderQuantity", expression = "java(mapReOrderQuantity(product))")
    ProductManagerResponseDto toProductManagerResponseDto(Product product);

    default Integer mapReOrderQuantity(Product product) {
        return product.getMinStock() - product.getStock();
    }

    @Mapping(source = "productId", target = "product.id")
    OrderItem toOrderItem(OrderItemRequestDto orderItemRequestDto);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    OrderItemResponseDto toOrderItemResponseDto(OrderItem orderItem);

    Order toOrder(OrderRequestDto orderRequestDto);

    @Mapping(source = "systemUser.id", target = "userId")
    OrderResponseDto toOrderResponseDto(Order order);


    @Mapping(source = "supplierId", target = "supplier.id")
    PurchaseOrder toPurchaseOrder(PurchaseOrderRequestDto purchaseOrderRequestDto);

    PurchaseOrderResponseDto toPurchaseOrderResponseDto(PurchaseOrder purchaseOrder);

    @Mapping(source = "purchaseOrderId", target = "purchaseOrder.id")
    @Mapping(source = "productId", target = "product.id")
    PurchaseOrderItem toPurchaseOrderItem(PurchaseOrderItemRequestDto orderItemRequestDto);


    PurchaseOrderItemResponseDto toPurchaseOrderItemResponseDto(PurchaseOrderItem purchaseOrderItem);

    @Mapping(target = "message", expression = "java(getMessage(user))")
    UserResponseMessageDto toUserResponseMessageDto(SystemUser user);

    default String getMessage(SystemUser user) {
        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("STORE_MANAGER")))
            return "Account created successfully: " + user.getFullName();
        else if (user.getRoles().stream().anyMatch(r -> r.getName().equals("CUSTOMER")))
            return "Signup successful. Please check your email for verification.";
        else if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN")))
            return "Account created successfully: " + user.getFullName();
        return "";
    }

    @Mapping(source = "fullName", target = "fullName")
    UserResponseDto toUserResponseDto(SystemUser user);

    Role toRole(RequestRoleDto requestRoleDto);

    RoleResponseDto toRoleResponseDto(Role role);
}
