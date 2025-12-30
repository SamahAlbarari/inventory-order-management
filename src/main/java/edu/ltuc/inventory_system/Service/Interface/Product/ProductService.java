package edu.ltuc.inventory_system.Service.Interface.Product;

import edu.ltuc.inventory_system.dto.RequestDtos.ProductManagerRequestDto;
import edu.ltuc.inventory_system.dto.RequestDtos.ProductUpdateRequestDto;
import edu.ltuc.inventory_system.dto.RequestDtos.ProductUpdateStatusDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.ProductCustomerResponseDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.ProductManagerResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {
    Page<ProductCustomerResponseDto> getAllProducts(Pageable pageable, String categoryName, Double minPrice, Double maxPrice, String productName);

    ProductCustomerResponseDto getProduct(Long productId);

    Long createProduct(ProductManagerRequestDto productRequest);

    ProductManagerResponseDto updateProduct(Long productId, ProductUpdateRequestDto productUpdateRequestDto);

    ProductManagerResponseDto updateStatus(Long id, ProductUpdateStatusDto status);

    List<ProductManagerResponseDto> getLowStockProducts();

    Long getTotalStock();
}
