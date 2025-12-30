# Inventory and Order Management System – Backend

A backend system for managing products, inventory, customer orders, suppliers, and purchase orders.  
This project focuses on real-world backend business logic with role-based access control and secure APIs.

---

## Team Members
- **SAMAH ALBARARI** – Backend Developer  
- **HUSSEIN ALHROOB** – Backend Developer  

> Frontend design & prototype prepared with Figma and AI tools.

---

## Project Overview
This application provides core backend functionalities for a store management system, including:

- Product and category management  
- Supplier management  
- Inventory and stock tracking  
- Customer order creation and order history  
- Purchase orders to suppliers  
- Low-stock monitoring and alerts  
- Fake payment processing for demonstration purposes  
- Role-based authentication and authorization using JWT  

This project is simpler than large-scale logistics or hotel systems but is highly practical and reflects real backend workflows used in production systems.

---

## User Roles

| Role | Description |
| --- | --- |
| **ADMIN** | Manages categories, suppliers, users, and system configurations |
| **STORE_MANAGER** | Manages products, stock, and purchase orders |
| **CUSTOMER** | Browses products and places orders |

---

## Core Functional Scenarios

### Customer
- Browse products with filters (category, price range, availability)
- View product details
- Place orders with stock validation
- View order history
- Cancel orders (if not shipped)

### Store Manager
- Add, update, and disable products
- Set minimum stock thresholds
- Monitor low-stock products
- Create purchase orders for suppliers
- Receive supplier deliveries and update stock

### Admin
- Create and manage categories
- Manage suppliers
- Create store manager accounts
- View system overview

---

## System Architecture

### Entities
- **User**
  - id, email, password, role (ADMIN, STORE_MANAGER, CUSTOMER)

- **Product**
  - id, name, description, price, categoryId, supplierId, stock, minStock, status

- **Category**
  - id, name, description

- **Supplier**
  - id, name, phone, email, address

- **Order**
  - id, customerId, totalPrice, status, paymentReference, createdAt

- **OrderItem**
  - id, orderId, productId, quantity, unitPrice, subTotal

- **PurchaseOrder**
  - id, supplierId, status (PENDING, RECEIVED, CANCELLED), createdAt

- **PurchaseOrderItem**
  - id, purchaseOrderId, productId, quantity

---

## Stock Management Rules

### Customer Order
- Stock availability is validated before order confirmation
- Orders are rejected if the requested quantity exceeds available stock
- Stock is deducted only after a successful order is created

### Purchase Order Received
- Product stock is increased when a purchase order is marked as received
- Stock updates reflect the delivered quantities from suppliers

### Low Stock Alert
- Products are flagged as low stock when current quantity is less than or equal to the minimum threshold
- Low stock data is used by store managers to create purchase orders

---

## Environment Variables

This project uses environment variables to manage sensitive configuration values.

```properties
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

app.jwt.secret=${JWT_SECRET}
jwt.base64Secret=${JWT_BASE64_SECRET}


