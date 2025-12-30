package edu.ltuc.inventory_system.Service.Interface.Product;

import edu.ltuc.inventory_system.dto.RequestDtos.CategoryRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.CategoryResponseDto;

import java.util.List;

public interface CategoryService {
    Long createCategory(CategoryRequestDto categoryRequestDto);

    CategoryResponseDto getCategoryById(Long categoryId);

    List<CategoryResponseDto> getAllCategories();
}
