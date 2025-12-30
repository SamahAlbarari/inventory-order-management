package edu.ltuc.inventory_system.Service.Implementation.Product;

import edu.ltuc.inventory_system.Exceptions.*;
import edu.ltuc.inventory_system.Mapper.EntityMapper;
import edu.ltuc.inventory_system.Repository.Product.CategoryRepository;
import edu.ltuc.inventory_system.Repository.Product.SupplierRepository;
import edu.ltuc.inventory_system.Service.Interface.Product.ProductService;
import edu.ltuc.inventory_system.dto.RequestDtos.ProductManagerRequestDto;
import edu.ltuc.inventory_system.dto.RequestDtos.ProductUpdateRequestDto;
import edu.ltuc.inventory_system.dto.RequestDtos.ProductUpdateStatusDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.ProductCustomerResponseDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.ProductManagerResponseDto;
import edu.ltuc.inventory_system.entity.Category;
import edu.ltuc.inventory_system.entity.Product;
import edu.ltuc.inventory_system.entity.Supplier;
import edu.ltuc.inventory_system.enums.ProductStatus;
import edu.ltuc.inventory_system.enums.StockStatus;
import edu.ltuc.inventory_system.Repository.Product.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;


@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    private final EntityMapper entityMapper = EntityMapper.INSTANCE;


    public Page<ProductCustomerResponseDto> getAllProducts(Pageable pageable,
                                                           String categoryName,
                                                           Double minPrice, Double maxPrice, String productName) {

        String upper = null;
        if (categoryName != null) {
            upper = categoryName.toUpperCase();
        }
        Page<Product> filteredProducts = productRepository.findFilteredProducts
                (upper, minPrice, maxPrice, productName, pageable);


        if (filteredProducts.isEmpty()) {
            throw new ProductNotFoundException("No products found matching the criteria");
        }
        return filteredProducts.map(product -> {
            StockStatus stockStatus = determineStockStatus(product);
            return new ProductCustomerResponseDto(
                    product.getId(),
                    product.getName(),
                    product.getDescription(),
                    product.getPrice(),
                    stockStatus,
                    product.getStatus()
            );
        });
    }


    public ProductCustomerResponseDto getProduct(Long productId) {
        Product product = productRepository.findById(productId).orElseThrow(() ->
                new ProductNotFoundException("Product By Id " + productId + " is Not Found"));
        StockStatus stockStatus = determineStockStatus(product);
        return new ProductCustomerResponseDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                stockStatus,
                product.getStatus()
        );
    }

    @Transactional
    public Long createProduct(ProductManagerRequestDto productRequest) {

        productRepository.findByNameIgnoreCase(productRequest.name()).
                ifPresent(productName -> {
                    throw new ProductIsExistException
                            ("Product with name '" + productRequest.name() + "' already exists.");
                });

        Category categoryById = categoryRepository.findById(productRequest.categoryId()).
                orElseThrow(() -> new CategoryNotFoundException
                        ("Category by " + productRequest.categoryId() + "is Not found "));

        Supplier supplierById = supplierRepository.findById(productRequest.supplierId()).orElseThrow(
                () -> new SupplierNotFoundException("supplier by Id " + productRequest.supplierId() + "is Not Found")
        );

        checkStock(productRequest.minStock(), productRequest.stock());

        checkProductStatus(productRequest.status());

        Product product = entityMapper.toProduct(productRequest);

        Product savedProduct = productRepository.save(product);

        ProductManagerResponseDto productManagerResponseDto =
                entityMapper.toProductManagerResponseDto(savedProduct);
        return productManagerResponseDto.id();
    }

    @Transactional
    public ProductManagerResponseDto updateProduct(Long productId, ProductUpdateRequestDto productUpdateRequestDto) {

        Product product = productRepository.findById(productId).orElseThrow(() ->
                new ProductNotFoundException("Product By Id " + productId + " is Not Found")
        );

        if (productUpdateRequestDto.price() != null) {
            product.setPrice(productUpdateRequestDto.price());
        }

        if (productUpdateRequestDto.minStock() != null) {
            checkStock(productUpdateRequestDto.minStock(), product.getStock());
            product.setMinStock(productUpdateRequestDto.minStock());
        }

        if (productUpdateRequestDto.status() != null) {
            checkProductStatus(productUpdateRequestDto.status());
            product.setStatus(ProductStatus.valueOf(productUpdateRequestDto.status().toUpperCase()));
        }

        Product updatedProduct = productRepository.save(product);

        return entityMapper.toProductManagerResponseDto(updatedProduct);
    }


    @Transactional
    public ProductManagerResponseDto updateStatus(Long productId, ProductUpdateStatusDto statusDto) {

        Product product = productRepository.findById(productId).orElseThrow(() ->
                new ProductNotFoundException("Product By Id  " + productId + "  is Not Found")
        );

        checkProductStatus(statusDto.status());
        product.setStatus(ProductStatus.valueOf(statusDto.status().toUpperCase()));

        Product updatedProduct = productRepository.save(product);
        return entityMapper.toProductManagerResponseDto(updatedProduct);
    }


    public List<ProductManagerResponseDto> getLowStockProducts() {
        List<Product> products = productRepository.findLowStockProducts();
        return products.stream()
                .map(entityMapper::toProductManagerResponseDto)
                .toList();
    }

    @Override
    public Long getTotalStock() {
        return productRepository.getTotalStock();
    }


    private StockStatus determineStockStatus(Product product) {
        if (product.getStock() == 0) return StockStatus.OUT_OF_STOCK;
        else if (product.getStock() <= product.getMinStock()) return StockStatus.LOW_STOCK;
        else return StockStatus.IN_STOCK;
    }


    private void checkProductStatus(String status) {
        if (!ProductStatus.contain(status)) {
            throw new InvalidProductStatusException(
                    "Invalid product status: '" + status
                            + "'. Allowed values are: " + Arrays.toString(ProductStatus.values())
            );
        }
    }

    private void checkStock(Integer minStock, Integer stock) {
        if (minStock > stock) {
            throw new InvalidStockException(
                    "Minimum stock cannot be greater than current stock. Current stock: "
                            + stock + ", requested minimum stock: "
                            + minStock
            );
        }
    }

}
