# Stripe Payment Integration Guide

## Overview

The Stripe payment integration is now fully initialized and ready to use. This guide explains how to set up and use Stripe payments in your OptyShop application.

## Prerequisites

1. **Stripe Account**: Sign up at [https://stripe.com](https://stripe.com)
2. **API Keys**: Get your test/live keys from Stripe Dashboard
3. **Webhook Secret**: Configure webhook endpoint in Stripe Dashboard

## Environment Configuration

Add these variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### Getting Your Keys

1. **Secret Key & Publishable Key**:
   - Go to Stripe Dashboard → Developers → API keys
   - Copy `Secret key` (starts with `sk_test_` or `sk_live_`)
   - Copy `Publishable key` (starts with `pk_test_` or `pk_live_`)

2. **Webhook Secret**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/payments/webhook`
   - Copy the `Signing secret` (starts with `whsec_`)

## Payment Flow

### 1. Frontend Integration (React/Vue/etc.)

```javascript
// Install Stripe.js
// npm install @stripe/stripe-js

import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY');

// Step 1: Create Payment Intent
const response = await fetch('/api/payments/create-intent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    order_id: orderId,
    amount: 199.99, // Optional, uses order total if omitted
    currency: 'USD'
  })
});

const { clientSecret, paymentIntentId } = await response.json();

// Step 2: Confirm Payment with Stripe.js
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Customer Name'
    }
  }
});

if (result.error) {
  // Handle error
} else {
  // Step 3: Confirm with backend
  await fetch('/api/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      payment_intent_id: paymentIntentId
    })
  });
}
```

## API Endpoints

### Customer Endpoints

#### 1. Create Payment Intent
```
POST /api/payments/create-intent
Authorization: Bearer {access_token}

Body:
{
  "order_id": 1,
  "amount": 199.99,  // Optional
  "currency": "USD" // Optional, defaults to USD
}

Response:
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx",
    "amount": 199.99,
    "currency": "usd",
    "status": "requires_payment_method",
    "transactionId": 1,
    "transactionNumber": "TXN-1703123456789-1234"
  }
}
```

#### 2. Confirm Payment
```
POST /api/payments/confirm
Authorization: Bearer {access_token}

Body:
{
  "payment_intent_id": "pi_1234567890"
}

Response:
{
  "success": true,
  "data": {
    "transaction": {
      "id": 1,
      "transactionNumber": "TXN-xxx",
      "status": "completed",
      "amount": 199.99,
      "netAmount": 193.99
    },
    "order": {
      "id": 1,
      "orderNumber": "ORD-xxx",
      "paymentStatus": "paid"
    }
  }
}
```

#### 3. Get Payment Intent Status
```
GET /api/payments/intent/:payment_intent_id
Authorization: Bearer {access_token}
```

### Admin Endpoints

#### 1. Create Refund
```
POST /api/payments/refund
Authorization: Bearer {admin_token}

Body:
{
  "transaction_id": 1,
  "amount": 50.00,  // Optional - omit for full refund
  "reason": "requested_by_customer" // Options: requested_by_customer, duplicate, fraudulent
}

Response:
{
  "success": true,
  "data": {
    "refund": {
      "id": "re_xxx",
      "amount": 50.00,
      "status": "succeeded"
    },
    "transaction": {
      "id": 2,
      "transactionNumber": "TXN-xxx",
      "type": "partial_refund",
      "amount": 50.00
    }
  }
}
```

### Webhook Endpoint

```
POST /api/payments/webhook
(No authentication - uses Stripe signature verification)

Headers:
  stripe-signature: {signature from Stripe}
```

**Note**: This endpoint must be configured in Stripe Dashboard to receive payment events.

## Automatic Transaction Creation

The system automatically:
1. Creates a transaction record when payment intent is created
2. Updates transaction status when payment is confirmed
3. Creates refund transactions when refunds are processed
4. Updates order payment status automatically

## Webhook Events Handled

- `payment_intent.succeeded` → Updates transaction to completed, order to paid
- `payment_intent.payment_failed` → Updates transaction to failed
- `charge.refunded` → Creates refund transaction, updates order if full refund

## Fee Calculation

Stripe fees are automatically calculated:
- **Fee Structure**: 2.9% + $0.30 per transaction
- **Net Amount**: Automatically calculated (amount - gateway_fee)
- Stored in transaction record for financial reporting

## Testing

### Test Cards (Stripe Test Mode)

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`
- Use any future expiry date and any 3-digit CVC

### Test Webhook Events

Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

## Security Notes

1. **Never expose secret keys** in frontend code
2. **Always verify webhook signatures** (handled automatically)
3. **Use HTTPS** in production
4. **Validate amounts** on backend before processing
5. **Store webhook secret** securely in environment variables

## Integration Checklist

- [ ] Add Stripe keys to `.env` file
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Test payment flow with test cards
- [ ] Verify transaction creation in database
- [ ] Test refund functionality
- [ ] Set up webhook endpoint (production URL)
- [ ] Switch to live keys when ready for production

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)

