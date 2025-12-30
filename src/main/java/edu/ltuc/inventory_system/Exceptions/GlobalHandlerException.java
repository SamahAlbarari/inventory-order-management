package edu.ltuc.inventory_system.Exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@ControllerAdvice
public class GlobalHandlerException {


    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidateException(MethodArgumentNotValidException exception) {

        Map<String, String> stringStringMap = new HashMap<>();
        exception
                .getBindingResult()
                .getFieldErrors().forEach(getfield ->
                        stringStringMap.put(getfield.getField(), getfield.getDefaultMessage()));
        return ResponseEntity.badRequest().body(stringStringMap);
    }

    @ExceptionHandler(URISyntaxException.class)
    public ResponseEntity<String> handleURISyntaxException(URISyntaxException exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }


    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<String> handleCategoryNotFoundException(CategoryNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }


    @ExceptionHandler(CategoryIsExistException.class)
    public ResponseEntity<String> handleCategoryNotFoundException(CategoryIsExistException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(exception.getMessage());
    }


    @ExceptionHandler(SupplierNotFoundException.class)
    public ResponseEntity<String> handleSupplierNotFoundException(SupplierNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }

    @ExceptionHandler(SupplierIsExistException.class)
    public ResponseEntity<String> handleSupplierIsExitException(SupplierIsExistException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(exception.getMessage());
    }

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<String> handleProductNotFoundException(ProductNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }

    @ExceptionHandler(ProductIsExistException.class)
    public ResponseEntity<String> handleProductIsExistException(ProductIsExistException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(exception.getMessage());
    }


    @ExceptionHandler(InvalidStockException.class)
    public ResponseEntity<String> handleInvalidStockException(InvalidStockException exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }


    @ExceptionHandler(InvalidProductStatusException.class)
    public ResponseEntity<String> handleInvalidProductStatusException(InvalidProductStatusException exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<String> handleOrderNotFoundException(OrderNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }

    @ExceptionHandler(PurchaseOrderNotFoundException.class)
    public ResponseEntity<String> handlePurchaseOrderFoundException(PurchaseOrderNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }

    @ExceptionHandler(InvalidPurchaseOrderStatusTransitionException.class)
    public ResponseEntity<String> handleInvalidPurchaseOrderStatusTransitionException(InvalidPurchaseOrderStatusTransitionException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(exception.getMessage());
    }

    @ExceptionHandler(InvalidOrderStatusTransitionException.class)
    public ResponseEntity<String> handleInvalidOrderStatusTransitionException(InvalidOrderStatusTransitionException exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }

    @ExceptionHandler(AccessFauilerException.class)
    public ResponseEntity<String> handleAccessFailureException(AccessFauilerException exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }

    @ExceptionHandler(EmailExistException.class)
    public ResponseEntity<Map<String, Object>> handleEmailExistException(EmailExistException exception) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", exception.getMessage() == null ? "Email already exists" : exception.getMessage());
        body.put("field", "email");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(DuplicateFieldException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateFieldException(DuplicateFieldException exception) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", exception.getMessage() == null ? "Duplicate fields" : exception.getMessage());
        Set<String> fields = exception.getFields();
        body.put("fields", fields);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }


    @ExceptionHandler(RoleNotFoundException.class)
    public ResponseEntity<String> handleRoleNotFoundException(RoleNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }

    @ExceptionHandler(RoleExistException.class)
    public ResponseEntity<String> handleRoleExistException(RoleExistException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(exception.getMessage());
    }


    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFoundException(UserNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }

}
