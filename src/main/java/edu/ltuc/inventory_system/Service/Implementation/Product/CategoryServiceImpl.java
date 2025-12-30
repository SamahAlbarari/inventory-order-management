package edu.ltuc.inventory_system.Service.Implementation.Product;

import edu.ltuc.inventory_system.Exceptions.CategoryIsExistException;
import edu.ltuc.inventory_system.Exceptions.CategoryNotFoundException;
import edu.ltuc.inventory_system.Mapper.EntityMapper;
import edu.ltuc.inventory_system.Service.Interface.Product.CategoryService;
import edu.ltuc.inventory_system.dto.RequestDtos.CategoryRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.CategoryResponseDto;
import edu.ltuc.inventory_system.entity.Category;
import edu.ltuc.inventory_system.Repository.Product.CategoryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final EntityMapper entityMapper = EntityMapper.INSTANCE;


    @Transactional
    public Long createCategory(CategoryRequestDto categoryRequestDto) {
        categoryRepository.
                findByNameIgnoreCase(categoryRequestDto.name()).ifPresent(categoryVal -> {
                    throw new CategoryIsExistException
                            ("Category with name '" + categoryVal.getName() + "' already exists.");
                });
        Category category = entityMapper.toCategory(categoryRequestDto);
        String categoryNameUpperCase = category.getName().toUpperCase();
        category.setName(categoryNameUpperCase);
        Category savedCategory = categoryRepository.save(category);
        CategoryResponseDto categoryResponseDto = entityMapper.toCategoryResponseDto(savedCategory);
        return categoryResponseDto.id();
    }


    public CategoryResponseDto getCategoryById(Long categoryId) {
        Category categoryById = categoryRepository.findById(categoryId).orElseThrow(
                () -> new CategoryNotFoundException("Category by Id " + categoryId + " is Not found"));
        return entityMapper.toCategoryResponseDto(categoryById);
    }

    @Override
    public List<CategoryResponseDto> getAllCategories() {
        return categoryRepository.findAll().stream().map(entityMapper::toCategoryResponseDto).toList();
    }


}
