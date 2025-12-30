package edu.ltuc.inventory_system.Service.Interface.Product;

import edu.ltuc.inventory_system.dto.RequestDtos.SupplierRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.SupplierResponseDto;
import edu.ltuc.inventory_system.entity.Supplier;

import java.util.List;

public interface SupplierService {

    Long createSupplier(SupplierRequestDto supplierRequestDto);

    SupplierResponseDto getSupplierById(Long supplierId);

    List<SupplierResponseDto> getAllSupplier();
}
