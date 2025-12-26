# Payment Flow Documentation - Admin Panel

## Overview

This document describes the payment flow from the **Admin Panel** perspective, including how to view, manage, and process payments, orders, and transactions.

---

## 📊 **Admin Panel Payment Flow Overview**

```
Customer Places Order
  ↓
Order Created (payment_status: 'pending')
  ↓
[If Stripe Payment]
  ↓
Payment Intent Created → Transaction Created (status: 'pending')
  ↓
Payment Confirmed → Transaction Updated (status: 'completed')
  ↓
Order Updated (payment_status: 'paid')
  ↓
Admin Can View & Manage
```

---

## 🔍 **Viewing Orders**

### **1. Get All Orders**

**Endpoint:** `GET /api/admin/orders`

**Authentication:** `Bearer {{admin_token}}`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by order status (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`)
- `payment_status` (optional): Filter by payment status (`pending`, `paid`, `failed`, `refunded`)
- `search` (optional): Search by order number, customer name, or email
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "order_number": "ORD-ABC123",
        "status": "processing",
        "payment_status": "paid",
        "payment_method": "stripe",
        "total": "199.99",
        "user": {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com"
        },
        "items": [...],
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
}
```

**What Admin Sees:**
- All orders with customer information
- Order status and payment status
- Order totals and payment method
- Order items with product details
- Contact lens details (if applicable)
- Order creation date

---

### **2. Get Order Details**

**Endpoint:** `GET /api/admin/orders/:id`

**Authentication:** `Bearer {{admin_token}}`

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "order_number": "ORD-ABC123",
      "status": "processing",
      "payment_status": "paid",
      "payment_method": "stripe",
      "payment_id": "pi_1234567890",
      "subtotal": "180.00",
      "tax": "18.00",
      "shipping": "0.00",
      "discount": "0.00",
      "total": "198.00",
      "shipping_address": {...},
      "billing_address": {...},
      "user": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "items": [
        {
          "id": 1,
          "product_id": 45,
          "product_name": "Premium Contact Lenses",
          "quantity": 2,
          "unit_price": "99.00",
          "total_price": "198.00",
          "contact_lens_details": {
            "right_eye": {
              "quantity": 1,
              "base_curve": 2,
              "diameter": 2,
              "power": 8
            },
            "left_eye": {
              "quantity": 1,
              "base_curve": 2,
              "diameter": 2,
              "power": 7
            }
          },
          "product": {...}
        }
      ],
      "prescription": {...},
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

**What Admin Sees:**
- Complete order information
- Customer details (name, email, phone)
- All order items with full specifications
- Contact lens details (formatted)
- Prescription information (if applicable)
- Shipping and billing addresses
- Payment gateway transaction ID

---

## 💳 **Viewing Transactions**

### **1. Get All Transactions**

**Endpoint:** `GET /api/admin/transactions`

**Authentication:** `Bearer {{admin_token}}`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `status` (optional): Filter by status (`pending`, `processing`, `completed`, `failed`, `cancelled`, `refunded`)
- `type` (optional): Filter by type (`payment`, `refund`, `partial_refund`, `chargeback`, `reversal`)
- `paymentMethod` (optional): Filter by payment method (`stripe`, `paypal`, `cod`)
- `userId` (optional): Filter by user ID
- `orderId` (optional): Filter by order ID
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "transaction_number": "TXN-1703123456789-1234",
        "order_id": 1,
        "user_id": 1,
        "type": "payment",
        "status": "completed",
        "payment_method": "stripe",
        "amount": "199.99",
        "currency": "USD",
        "gateway_transaction_id": "pi_1234567890",
        "gateway_fee": "5.99",
        "net_amount": "194.00",
        "description": "Payment for order ORD-ABC123",
        "processed_at": "2024-01-15T10:35:00Z",
        "order": {
          "id": 1,
          "order_number": "ORD-ABC123",
          "status": "processing",
          "total": "199.99"
        },
        "user": {
          "id": 1,
          "email": "john@example.com",
          "first_name": "John",
          "last_name": "Doe"
        },
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 500,
      "pages": 10
    }
  }
}
```

**What Admin Sees:**
- All transactions with filtering options
- Transaction type and status
- Payment method and gateway details
- Amount, fees, and net amount
- Linked order and customer information
- Gateway transaction ID
- Processing date

---

### **2. Get Transaction Details**

**Endpoint:** `GET /api/admin/transactions/:id`

**Authentication:** `Bearer {{admin_token}}`

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": 1,
      "transaction_number": "TXN-1703123456789-1234",
      "order_id": 1,
      "user_id": 1,
      "type": "payment",
      "status": "completed",
      "payment_method": "stripe",
      "amount": "199.99",
      "currency": "USD",
      "gateway_transaction_id": "pi_1234567890",
      "gateway_response": {
        "id": "pi_1234567890",
        "status": "succeeded",
        "amount": 19999,
        "currency": "usd",
        "receipt_url": "https://pay.stripe.com/receipts/..."
      },
      "gateway_fee": "5.99",
      "net_amount": "194.00",
      "description": "Payment for order ORD-ABC123",
      "metadata": {...},
      "processed_at": "2024-01-15T10:35:00Z",
      "order": {...},
      "user": {...},
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

**What Admin Sees:**
- Complete transaction information
- Full gateway response (Stripe response)
- Receipt URL (if available)
- Metadata (custom data)
- Linked order and customer details

---

### **3. Get Transaction Statistics**

**Endpoint:** `GET /api/admin/transactions/stats`

**Authentication:** `Bearer {{admin_token}}`

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalTransactions": 1000,
      "completedTransactions": 950,
      "failedTransactions": 30,
      "pendingTransactions": 20,
      "totalAmount": 199990.00,
      "totalRevenue": 194000.00,
      "transactionsByMethod": [
        {
          "method": "stripe",
          "count": 800,
          "totalAmount": 159920.00
        },
        {
          "method": "paypal",
          "count": 100,
          "totalAmount": 19990.00
        },
        {
          "method": "cod",
          "count": 50,
          "totalAmount": 9980.00
        }
      ],
      "transactionsByStatus": [
        {
          "status": "completed",
          "count": 950
        },
        {
          "status": "pending",
          "count": 20
        },
        {
          "status": "failed",
          "count": 30
        }
      ]
    }
  }
}
```

**What Admin Sees:**
- Total transaction counts
- Revenue statistics
- Breakdown by payment method
- Breakdown by status
- Date range filtering

---

## 🛠️ **Managing Orders**

### **1. Update Order Status**

**Endpoint:** `PUT /api/orders/:id/status`

**Authentication:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "status": "shipped"
}
```

**Valid Statuses:**
- `pending`
- `confirmed`
- `processing`
- `shipped`
- `delivered`
- `cancelled`
- `refunded`

**Response:**
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "order": {
      "id": 1,
      "status": "shipped",
      "shipped_at": "2024-01-16T10:00:00Z"
    }
  }
}
```

**What Happens:**
- Order status is updated
- If status is `shipped`, `shipped_at` is automatically set
- If status is `delivered`, `delivered_at` is automatically set

---

### **2. Process Refund**

**Endpoint:** `POST /api/orders/:id/refund`

**Authentication:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "amount": 50.00,
  "reason": "requested_by_customer"
}
```

**Request Body (Full Refund):**
```json
{
  "reason": "requested_by_customer"
}
```

**Valid Reasons:**
- `requested_by_customer`
- `duplicate`
- `fraudulent`

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refund": {
      "id": "re_1234567890",
      "amount": 50.00,
      "status": "succeeded"
    },
    "transaction": {
      "id": 2,
      "transactionNumber": "TXN-1703123456789-5678",
      "type": "partial_refund",
      "amount": 50.00
    }
  }
}
```

**What Happens:**
- Refund is processed through Stripe (if payment method is `stripe`)
- New refund transaction is created automatically
- Order `payment_status` is updated to `refunded` (if full refund)
- Transaction type is `partial_refund` or `refund` based on amount

---

### **3. Assign Technician**

**Endpoint:** `PUT /api/orders/:id/assign-technician`

**Authentication:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "technician_name": "John Smith",
  "technician_id": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Technician assigned successfully",
  "data": {
    "order": {
      "id": 1,
      "status": "processing",
      "notes": "Assigned to technician: John Smith (ID: 5)"
    }
  }
}
```

**What Happens:**
- Order status is updated to `processing`
- Technician information is added to order notes

---

## 💰 **Managing Transactions**

### **1. Create Transaction Manually**

**Endpoint:** `POST /api/admin/transactions`

**Authentication:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "order_id": 1,
  "user_id": 1,
  "type": "payment",
  "status": "completed",
  "payment_method": "cod",
  "amount": 199.99,
  "currency": "USD",
  "gateway_transaction_id": null,
  "gateway_response": null,
  "gateway_fee": 0,
  "description": "Cash on delivery payment",
  "metadata": {
    "source": "admin_panel",
    "notes": "Customer paid in cash"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transaction": {
      "id": 100,
      "transaction_number": "TXN-1703123456789-9999",
      "order_id": 1,
      "type": "payment",
      "status": "completed",
      "amount": "199.99"
    }
  }
}
```

**What Happens:**
- Transaction is created
- If status is `completed` and type is `payment`, order `payment_status` is automatically updated to `paid`
- Transaction number is automatically generated

**Use Cases:**
- Cash on delivery payments
- Check payments
- Bank transfer payments
- Manual payment entries

---

### **2. Update Transaction Status**

**Endpoint:** `PUT /api/admin/transactions/:id/status`

**Authentication:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "status": "completed",
  "gateway_response": {
    "id": "ch_1234567890",
    "status": "succeeded",
    "receipt_url": "https://pay.stripe.com/receipts/..."
  },
  "metadata": {
    "updated_by": "admin@example.com",
    "notes": "Payment confirmed"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction status updated successfully",
  "data": {
    "transaction": {
      "id": 1,
      "status": "completed",
      "processed_at": "2024-01-15T10:35:00Z"
    }
  }
}
```

**What Happens:**
- Transaction status is updated
- If status is `completed` and type is `payment`, order `payment_status` is automatically updated to `paid`
- If status is `refunded` and type is `refund`, order `payment_status` is automatically updated to `refunded`
- `processed_at` is set when status becomes `completed`

---

## 🔄 **Payment Flow Scenarios**

### **Scenario 1: Stripe Payment (Automatic)**

1. **Customer creates order** → Order created with `payment_status: 'pending'`
2. **Customer creates payment intent** → Transaction created with `status: 'pending'`
3. **Customer confirms payment** → Transaction updated to `status: 'completed'`, Order updated to `payment_status: 'paid'`
4. **Admin views order** → Sees order with `payment_status: 'paid'` and linked transaction

**Admin Actions:**
- View order details
- View transaction details
- Process refund if needed
- Update order status

---

### **Scenario 2: Cash on Delivery (Manual)**

1. **Customer creates order** → Order created with `payment_method: 'cod'`, `payment_status: 'pending'`
2. **Customer receives order** → Customer pays cash
3. **Admin creates transaction** → Transaction created with `status: 'completed'`, Order updated to `payment_status: 'paid'`

**Admin Actions:**
- Create transaction manually
- Update order status to `delivered`

---

### **Scenario 3: Payment Failed**

1. **Customer creates order** → Order created with `payment_status: 'pending'`
2. **Customer creates payment intent** → Transaction created with `status: 'pending'`
3. **Payment fails** → Transaction updated to `status: 'failed'`, Order remains `payment_status: 'pending'`

**Admin Actions:**
- View failed transaction
- Contact customer
- Cancel order if needed
- Create new transaction if customer pays later

---

### **Scenario 4: Refund Processing**

1. **Customer requests refund** → Admin processes refund
2. **Admin calls refund endpoint** → Refund transaction created, Order updated to `payment_status: 'refunded'` (if full refund)

**Admin Actions:**
- Process full or partial refund
- View refund transaction
- Update order status if needed

---

## 📋 **Key Features**

### **Automatic Updates**

- ✅ Transaction creation automatically updates order `payment_status` when transaction is `completed`
- ✅ Refund processing automatically updates order `payment_status` to `refunded` (if full refund)
- ✅ Order status updates automatically set `shipped_at` and `delivered_at` timestamps

### **Transaction Linking**

- ✅ All transactions are linked to orders
- ✅ All transactions are linked to users
- ✅ Admin can view all transactions for an order
- ✅ Admin can view all transactions for a user

### **Payment Methods**

- ✅ **Stripe**: Automatic payment processing with gateway integration
- ✅ **PayPal**: Order created, transaction can be created manually
- ✅ **COD (Cash on Delivery)**: Order created, transaction created manually when payment received

### **Filtering & Search**

- ✅ Filter orders by status, payment status, date range
- ✅ Filter transactions by status, type, payment method, user, order, date range
- ✅ Search orders by order number, customer name, or email
- ✅ Get transaction statistics with date range filtering

---

## 🔐 **Security**

- All admin endpoints require `Bearer {{admin_token}}` authentication
- Admin can only access orders and transactions (no customer restrictions)
- Transaction creation and updates are logged
- Refund processing requires valid transaction and order

---

## 📝 **Best Practices**

1. **Always verify order and transaction details before processing refunds**
2. **Use transaction statistics to monitor payment trends**
3. **Create manual transactions immediately after receiving cash/check payments**
4. **Update order status promptly after shipping/delivery**
5. **Review failed transactions regularly and contact customers**
6. **Use metadata field to add notes and context to transactions**

---

## 🚨 **Error Handling**

### **Common Errors:**

- **Order not found**: Verify order ID exists
- **Transaction not found**: Verify transaction ID exists
- **Invalid status**: Use valid status values
- **Refund failed**: Check transaction status (must be `completed`)
- **Unauthorized**: Verify admin token is valid

---

## 📞 **Support**

For issues or questions about the payment flow:
1. Check transaction gateway response for details
2. Review order and transaction logs
3. Contact development team with order/transaction IDs

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0

