package edu.ltuc.inventory_system.Controller.Product;

import edu.ltuc.inventory_system.Config.DataProperties;
import edu.ltuc.inventory_system.Service.Interface.Product.ProductService;
import edu.ltuc.inventory_system.dto.RequestDtos.ProductManagerRequestDto;
import edu.ltuc.inventory_system.dto.RequestDtos.ProductUpdateRequestDto;
import edu.ltuc.inventory_system.dto.RequestDtos.ProductUpdateStatusDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.ProductCustomerResponseDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.ProductManagerResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final DataProperties dataProperties;


    @PreAuthorize("hasAnyAuthority('CUSTOMER', 'STORE_MANAGER')")
    @GetMapping("/products")
    public ResponseEntity<Page<ProductCustomerResponseDto>> getAllProducts(
            @PageableDefault(page = 0, size = 10, sort = "price") Pageable pageable,
            @RequestParam(required = false) String categoryName,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String productName
    ) {
        Page<ProductCustomerResponseDto> products =
                productService.getAllProducts(pageable, categoryName, minPrice, maxPrice, productName);
        return ResponseEntity.ok(products);
    }


    @PreAuthorize("hasAnyAuthority('CUSTOMER', 'STORE_MANAGER')")
    @GetMapping("/products/{id}")
    public ResponseEntity<ProductCustomerResponseDto> getProduct(@PathVariable Long id) {
        ProductCustomerResponseDto product = productService.getProduct(id);
        return ResponseEntity.ok(product);
    }


    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @PostMapping("/products")
    public ResponseEntity<ProductManagerResponseDto> createProduct(@Valid @RequestBody ProductManagerRequestDto productRequestDto) throws URISyntaxException {
        Long productId = productService.createProduct(productRequestDto);
        return ResponseEntity.created(new URI(dataProperties.getBaseUrl() + "/api/products/" + productId)).build();
    }


    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @PutMapping("/products/{id}")
    public ResponseEntity<ProductManagerResponseDto> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductUpdateRequestDto productUpdateRequestDto) {
        ProductManagerResponseDto updatedProduct = productService.updateProduct(id, productUpdateRequestDto);
        return ResponseEntity.ok(updatedProduct);
    }

    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @PatchMapping("/products/{id}/status")
    public ResponseEntity<ProductManagerResponseDto> updateStatus(@PathVariable Long id, @Valid @RequestBody ProductUpdateStatusDto status) {
        ProductManagerResponseDto productUpdatedStatus = productService.updateStatus(id, status);
        return ResponseEntity.ok(productUpdatedStatus);
    }

    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @GetMapping("manager/products/low-stock")
    public ResponseEntity<List<ProductManagerResponseDto>> getLowStockProducts() {
        List<ProductManagerResponseDto> lowStockProducts = productService.getLowStockProducts();
        return ResponseEntity.ok(lowStockProducts);
    }


    @PreAuthorize("hasAuthority('STORE_MANAGER')")
    @GetMapping("/manager/products/total-stock")
    public ResponseEntity<Long> getTotalStock() {
        Long totalStock = productService.getTotalStock();
        return ResponseEntity.ok(totalStock);
    }

}

