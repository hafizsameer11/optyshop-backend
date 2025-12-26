# Payment Flow Documentation - Website/Frontend

## Overview

This document describes the payment flow from the **Website/Frontend** perspective, including how customers place orders, make payments, and view their order history.

---

## 🛒 **Complete Payment Flow**

```
1. Cart Page (/cart)
   └─> Customer adds items to cart
       └─> Items stored in CartContext

2. Checkout Page (/checkout)
   └─> Customer fills shipping & payment info
   └─> Selects payment method (Stripe/PayPal/COD)
   └─> Clicks "Place Order"
       │
       └─> POST /api/orders
           └─> Order created
           └─> Returns: { id, order_number, ... }

3. Payment Page (/payment?orderId=123) [Only for Stripe]
   └─> Page loads
       │
       ├─> Extract orderId from URL
       ├─> Initialize Stripe: getStripe()
       └─> POST /api/payments/create-intent
           └─> Payment Intent created
           └─> Returns: { client_secret, payment_intent_id }
       │
       └─> Render Stripe Elements
           └─> <PaymentElement />
           └─> Customer enters card details
           └─> Clicks "Pay Now"
               │
               ├─> stripe.confirmPayment() [Stripe.js]
               └─> POST /api/payments/confirm
                   └─> Transaction created/updated
                   └─> Order payment_status → 'paid'

4. Success Redirect
   └─> Navigate to: /customer/orders/{orderId}
       └─> OrderDetail.tsx shows order with payment status
```

---

## 📋 **Step-by-Step Implementation**

### **Step 1: Cart Page (`/cart`)**

**Purpose:** Customer views and manages cart items

**Implementation:**
- Display cart items from `CartContext`
- Allow quantity updates
- Show cart total
- Proceed to checkout button

**No API calls required** (cart is managed in frontend state)

---

### **Step 2: Checkout Page (`/checkout`)**

**Purpose:** Customer enters shipping and payment information

**Components:**
- Shipping address form
- Billing address form (optional)
- Payment method selection (Stripe/PayPal/COD)
- Order summary

**API Call: Create Order**

**Endpoint:** `POST /api/orders`

**Authentication:** `Bearer {{access_token}}`

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "lens_index": 1.61,
      "lens_coatings": ["ar", "blue_light"],
      "frame_size_id": 2
    }
  ],
  "prescription_id": 1,
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "billing_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "payment_method": "stripe",
  "notes": "Please deliver before 5 PM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": 1,
      "order_number": "ORD-ABC123",
      "status": "pending",
      "payment_status": "pending",
      "payment_method": "stripe",
      "total": "199.99",
      "items": [...],
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Frontend Logic:**
```javascript
// Checkout.tsx
const handleSubmit = async (formData) => {
  try {
    // Validate form
    if (!formData.shipping_address) {
      throw new Error('Shipping address is required');
    }

    // Map cart items to order format
    const orderData = {
      items: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        lens_index: item.lens_index,
        lens_coatings: item.lens_coatings,
        frame_size_id: item.frame_size_id
      })),
      prescription_id: selectedPrescriptionId,
      shipping_address: formData.shipping_address,
      billing_address: formData.billing_address,
      payment_method: formData.payment_method,
      notes: formData.notes
    };

    // Create order
    const response = await createOrder(orderData);
    const order = response.data.order;

    // Handle based on payment method
    if (formData.payment_method === 'stripe') {
      // Clear cart
      clearCart();
      
      // Navigate to payment page
      navigate(`/payment?orderId=${order.id}`);
    } else if (formData.payment_method === 'paypal') {
      // Clear cart
      clearCart();
      
      // Navigate to success page
      navigate(`/customer/orders/${order.id}`);
    } else if (formData.payment_method === 'cod') {
      // Clear cart
      clearCart();
      
      // Navigate to success page
      navigate(`/customer/orders/${order.id}`);
    }
  } catch (error) {
    // Show error message
    setError(error.message);
  }
};
```

**What Happens:**
- Order is created with `status: 'pending'` and `payment_status: 'pending'`
- Cart is cleared automatically by backend
- Product stock is updated
- If payment method is `stripe`, redirect to payment page
- If payment method is `paypal` or `cod`, redirect to order success page

---

### **Step 3: Payment Page (`/payment?orderId=123`) [Stripe Only]**

**Purpose:** Customer enters card details and completes Stripe payment

**Components:**
- Stripe Elements (card input)
- Order summary
- Pay Now button

**API Call 1: Create Payment Intent**

**Endpoint:** `POST /api/payments/create-intent`

**Authentication:** `Bearer {{access_token}}`

**Request Body:**
```json
{
  "order_id": 1,
  "currency": "USD"
}
```

**Note:** `amount` is optional - if not provided, uses order total

**Response:**
```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "clientSecret": "pi_1234567890_secret_xxx",
    "paymentIntentId": "pi_1234567890",
    "amount": 199.99,
    "currency": "usd",
    "status": "requires_payment_method",
    "transactionId": 1,
    "transactionNumber": "TXN-1703123456789-1234"
  }
}
```

**Frontend Logic:**
```javascript
// Payment.tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Payment = () => {
  const [orderId, setOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract orderId from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('orderId');
    setOrderId(id);

    // Initialize Stripe and create payment intent
    const initializePayment = async () => {
      try {
        // Create payment intent
        const response = await createPaymentIntent({
          order_id: parseInt(id),
          currency: 'USD'
        });

        setClientSecret(response.data.clientSecret);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      initializePayment();
    }
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!clientSecret) return <div>Failed to initialize payment</div>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm orderId={orderId} />
    </Elements>
  );
};

// PaymentForm.tsx
const PaymentForm = ({ orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Confirm payment with Stripe.js
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/customer/orders/${orderId}`
        },
        redirect: 'if_required' // Don't redirect for 3D Secure, handle in code
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Step 2: Confirm payment on backend
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const response = await confirmPayment({
          payment_intent_id: paymentIntent.id
        });

        // Navigate to success page
        navigate(`/customer/orders/${orderId}`);
      }
    } catch (error) {
      // Show error message
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};
```

**API Call 2: Confirm Payment**

**Endpoint:** `POST /api/payments/confirm`

**Authentication:** `Bearer {{access_token}}`

**Request Body:**
```json
{
  "payment_intent_id": "pi_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "transaction": {
      "id": 1,
      "transactionNumber": "TXN-1703123456789-1234",
      "status": "completed",
      "amount": 199.99,
      "netAmount": 194.00
    },
    "order": {
      "id": 1,
      "orderNumber": "ORD-ABC123",
      "paymentStatus": "paid"
    }
  }
}
```

**What Happens:**
1. Payment intent is created (transaction created with `status: 'pending'`)
2. Customer enters card details in Stripe Elements
3. Customer clicks "Pay Now"
4. Frontend calls `stripe.confirmPayment()` (Stripe.js handles payment)
5. If successful, frontend calls backend `confirmPayment()` endpoint
6. Backend:
   - Verifies payment with Stripe
   - Updates transaction to `status: 'completed'`
   - Updates order `payment_status` to `'paid'`
7. Customer is redirected to order success page

---

### **Step 4: Order Success Page (`/customer/orders/:id`)**

**Purpose:** Customer views order confirmation and details

**API Call: Get Order**

**Endpoint:** `GET /api/orders/:id`

**Authentication:** `Bearer {{access_token}}`

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "order_number": "ORD-ABC123",
      "status": "pending",
      "payment_status": "paid",
      "payment_method": "stripe",
      "total": "199.99",
      "items": [...],
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Frontend Logic:**
```javascript
// OrderDetail.tsx
const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrder(id);
        setOrder(response.data.order);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <h1>Order Confirmation</h1>
      <p>Order Number: {order.order_number}</p>
      <p>Status: {order.status}</p>
      <p>Payment Status: {order.payment_status}</p>
      <p>Total: ${order.total}</p>
      {/* Display order items, shipping address, etc. */}
    </div>
  );
};
```

---

## 🔄 **Alternative Payment Flows**

### **PayPal Payment**

**Flow:**
1. Customer selects PayPal as payment method
2. Order is created (same as Stripe flow)
3. Customer is redirected to PayPal (if implemented)
4. After PayPal payment, customer returns to success page
5. Admin can create transaction manually if needed

**Note:** PayPal integration requires additional PayPal SDK setup

---

### **Cash on Delivery (COD)**

**Flow:**
1. Customer selects COD as payment method
2. Order is created with `payment_method: 'cod'`
3. Customer is redirected to success page
4. Order shows `payment_status: 'pending'`
5. Admin creates transaction manually when payment is received

**Frontend:**
```javascript
if (payment_method === 'cod') {
  // Clear cart
  clearCart();
  
  // Navigate to success page
  navigate(`/customer/orders/${order.id}`);
  
  // Show message: "Your order has been placed. Payment will be collected on delivery."
}
```

---

## 📱 **API Service Functions**

### **ordersService.ts**

```javascript
import api from './api';

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getOrder = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const getOrders = async (params = {}) => {
  const response = await api.get('/orders', { params });
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await api.put(`/orders/${orderId}/cancel`);
  return response.data;
};
```

### **paymentsService.ts**

```javascript
import api from './api';

export const createPaymentIntent = async (data) => {
  const response = await api.post('/payments/create-intent', data);
  return response.data;
};

export const confirmPayment = async (paymentIntentId) => {
  const response = await api.post('/payments/confirm', {
    payment_intent_id: paymentIntentId
  });
  return response.data;
};

export const getPaymentIntentStatus = async (paymentIntentId) => {
  const response = await api.get(`/payments/intent/${paymentIntentId}`);
  return response.data;
};
```

### **stripeService.ts**

```javascript
import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};
```

---

## 🔐 **Authentication**

All API calls require authentication:

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## ⚠️ **Error Handling**

### **Order Creation Fails**

```javascript
try {
  const response = await createOrder(orderData);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    setError(error.response.data.message);
  } else if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    navigate('/login');
  } else {
    // Other errors
    setError('Failed to create order. Please try again.');
  }
}
```

### **Payment Intent Creation Fails**

```javascript
try {
  const response = await createPaymentIntent({ order_id: orderId });
} catch (error) {
  if (error.response?.status === 404) {
    // Order not found
    setError('Order not found. Please try again.');
    navigate('/checkout');
  } else if (error.response?.status === 400) {
    // Order already paid
    setError('This order has already been paid.');
    navigate(`/customer/orders/${orderId}`);
  } else {
    setError('Failed to initialize payment. Please try again.');
  }
}
```

### **Payment Confirmation Fails**

```javascript
try {
  const response = await confirmPayment(paymentIntent.id);
} catch (error) {
  // Payment succeeded with Stripe but backend confirmation failed
  // Show message to contact support
  setError('Payment was processed but confirmation failed. Please contact support with order number.');
  
  // Still redirect to order page
  navigate(`/customer/orders/${orderId}`);
}
```

---

## 🎯 **Key Features**

### **Automatic Cart Clearing**

- Cart is automatically cleared when order is created (backend handles this)
- No need to manually clear cart in frontend

### **Payment Status Tracking**

- Order `payment_status` is automatically updated when payment is confirmed
- Frontend can check `payment_status` to show appropriate UI

### **Transaction Creation**

- Transaction is automatically created when payment intent is created
- Transaction is automatically updated when payment is confirmed
- Frontend receives `transactionId` and `transactionNumber` for reference

### **3D Secure Support**

- Stripe Elements automatically handles 3D Secure authentication
- Use `redirect: 'if_required'` to handle in code instead of redirecting
- Check `paymentIntent.status` after confirmation

---

## 📋 **Best Practices**

1. **Always validate form data before submitting**
2. **Show loading states during API calls**
3. **Handle errors gracefully with user-friendly messages**
4. **Clear cart only after successful order creation**
5. **Store order ID in URL for easy navigation**
6. **Show order confirmation immediately after payment**
7. **Allow customers to view order history**
8. **Implement retry logic for failed API calls**

---

## 🔄 **State Management**

### **Cart State (CartContext)**

```javascript
// CartContext.js
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    // Add item to cart
  };

  const removeFromCart = (itemId) => {
    // Remove item from cart
  };

  const clearCart = () => {
    // Clear cart (called after order creation)
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
```

### **Order State**

- Store current order in component state or context
- Update order state after payment confirmation
- Refresh order data when viewing order details

---

## 🚨 **Common Issues & Solutions**

### **Issue: Payment Intent Creation Fails**

**Solution:**
- Verify order exists and belongs to user
- Check if order is already paid
- Ensure authentication token is valid

### **Issue: Payment Confirmation Fails**

**Solution:**
- Verify payment intent ID is correct
- Check if payment was successful with Stripe
- Contact support if payment succeeded but confirmation failed

### **Issue: Cart Not Clearing**

**Solution:**
- Backend automatically clears cart on order creation
- If cart persists, check backend response
- Manually clear cart in frontend as fallback

---

## 📞 **Support**

For payment issues:
1. Check browser console for errors
2. Verify Stripe keys are configured correctly
3. Check network tab for API responses
4. Contact support with order number and transaction ID

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0

