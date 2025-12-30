package edu.ltuc.inventory_system.Controller.Product;

import edu.ltuc.inventory_system.Config.DataProperties;
import edu.ltuc.inventory_system.Service.Interface.Product.SupplierService;
import edu.ltuc.inventory_system.dto.RequestDtos.SupplierRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.CategoryResponseDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.SupplierResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

@RestController
@RequestMapping("api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;
    private final DataProperties dataProperties;

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    public ResponseEntity<SupplierResponseDto> createSupplier(@Valid @RequestBody SupplierRequestDto supplierRequestDto) throws URISyntaxException {
        Long supplierId = supplierService.createSupplier(supplierRequestDto);
        return ResponseEntity.created(new URI(dataProperties.getBaseUrl() + "/api/suppliers/" + supplierId)).build();
    }


    @PreAuthorize("hasAnyAuthority('ADMIN', 'STORE_MANAGER')")
    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponseDto> getSupplier(@PathVariable Long id) {
        SupplierResponseDto supplierById = supplierService.getSupplierById(id);
        return ResponseEntity.ok(supplierById);
    }


    @PreAuthorize("hasAnyAuthority('ADMIN', 'STORE_MANAGER')")
    @GetMapping
    public ResponseEntity<List<SupplierResponseDto>> getAllSuppliers() {
        List<SupplierResponseDto> allSupplier = supplierService.getAllSupplier();
        return ResponseEntity.ok(allSupplier);
    }

}
