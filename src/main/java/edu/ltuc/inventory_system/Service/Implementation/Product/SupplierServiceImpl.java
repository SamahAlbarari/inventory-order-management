package edu.ltuc.inventory_system.Service.Implementation.Product;

import edu.ltuc.inventory_system.Exceptions.SupplierIsExistException;
import edu.ltuc.inventory_system.Exceptions.SupplierNotFoundException;
import edu.ltuc.inventory_system.Mapper.EntityMapper;
import edu.ltuc.inventory_system.Service.Interface.Product.SupplierService;
import edu.ltuc.inventory_system.dto.RequestDtos.SupplierRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.SupplierResponseDto;
import edu.ltuc.inventory_system.entity.Supplier;
import edu.ltuc.inventory_system.Repository.Product.SupplierRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final EntityMapper entityMapper = EntityMapper.INSTANCE;


    @Transactional
    public Long createSupplier(SupplierRequestDto supplierRequestDto) {
        supplierRepository.
                findByEmail(supplierRequestDto.email()).ifPresent(supplierVal -> {
                    throw new SupplierIsExistException
                            ("Supplier with email " + supplierVal.getEmail() + " already exists.");
                });
        Supplier supplier = entityMapper.toSupplier(supplierRequestDto);
        Supplier savedSupplier = supplierRepository.save(supplier);
        SupplierResponseDto supplierResponseDto = entityMapper.toSupplierResponseDto(savedSupplier);
        return supplierResponseDto.id();
    }

    public SupplierResponseDto getSupplierById(Long supplierId) {
        Supplier supplierById = supplierRepository.findById(supplierId).orElseThrow(
                () -> new SupplierNotFoundException("Supplier by Id " + supplierId + " is Not found"));
        return entityMapper.toSupplierResponseDto(supplierById);
    }

    @Override
    public List<SupplierResponseDto> getAllSupplier() {
        return supplierRepository.findAll().stream().map(entityMapper::toSupplierResponseDto).toList();
    }

}
