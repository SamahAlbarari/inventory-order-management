package edu.ltuc.inventory_system.Controller.Product;

import edu.ltuc.inventory_system.Config.DataProperties;
import edu.ltuc.inventory_system.Service.Interface.Product.CategoryService;
import edu.ltuc.inventory_system.dto.RequestDtos.CategoryRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.CategoryResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

@RestController
@RequestMapping("api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final DataProperties dataProperties;


    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createCategory(@Valid @RequestBody CategoryRequestDto categoryRequestDto) throws URISyntaxException {
        Long categoryId = categoryService.createCategory(categoryRequestDto);
        return ResponseEntity.created(new URI(dataProperties.getBaseUrl() + "/api/categories/" + categoryId)).build();
    }


    @PreAuthorize("hasAnyAuthority('ADMIN', 'STORE_MANAGER')")
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDto> getCategory(@PathVariable Long id) {
        CategoryResponseDto categoryById = categoryService.getCategoryById(id);
        return ResponseEntity.ok(categoryById);
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'STORE_MANAGER')")
    @GetMapping
    public ResponseEntity<List<CategoryResponseDto>> getAllCategories() {
        List<CategoryResponseDto> allCategories = categoryService.getAllCategories();
        return ResponseEntity.ok(allCategories);
    }

}
