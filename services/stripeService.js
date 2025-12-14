const Stripe = require('stripe');
const prisma = require('../lib/prisma');

let stripeClient = null;

/**
 * Initialize Stripe client (lazy initialization)
 * @returns {Object} Stripe client instance
 */
const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Please add STRIPE_SECRET_KEY to your .env file or disable Stripe features.');
  }
  
  // Initialize only when needed and only once
  if (!stripeClient) {
    stripeClient = Stripe(process.env.STRIPE_SECRET_KEY);
  }
  
  return stripeClient;
};

/**
 * Create a payment intent for an order
 * @param {Number} amount - Amount in cents
 * @param {String} currency - Currency code (default: 'usd')
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Stripe PaymentIntent
 */
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const stripeClient = getStripeClient();
    
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        created_at: new Date().toISOString()
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    };
  } catch (error) {
    console.error('Stripe PaymentIntent creation error:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Confirm a payment intent
 * @param {String} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} Confirmed PaymentIntent
 */
const confirmPaymentIntent = async (paymentIntentId) => {
  try {
    const stripeClient = getStripeClient();
    
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          charges: paymentIntent.charges.data,
          metadata: paymentIntent.metadata
        }
      };
    }

    return {
      success: false,
      error: `Payment intent status is ${paymentIntent.status}`,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status
      }
    };
  } catch (error) {
    console.error('Stripe PaymentIntent confirmation error:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Create a refund
 * @param {String} paymentIntentId - Stripe PaymentIntent ID
 * @param {Number} amount - Refund amount in dollars (null for full refund)
 * @param {String} reason - Refund reason
 * @returns {Promise<Object>} Refund object
 */
const createRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const stripeClient = getStripeClient();
    
    // Get the charge ID from the payment intent
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    const chargeId = paymentIntent.latest_charge;

    if (!chargeId) {
      return {
        success: false,
        error: 'No charge found for this payment intent'
      };
    }

    const refundParams = {
      charge: chargeId,
      reason: reason
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripeClient.refunds.create(refundParams);

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason
      }
    };
  } catch (error) {
    console.error('Stripe refund error:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Get payment intent details
 * @param {String} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} PaymentIntent details
 */
const getPaymentIntent = async (paymentIntentId) => {
  try {
    const stripeClient = getStripeClient();
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        client_secret: paymentIntent.client_secret,
        charges: paymentIntent.charges.data.map(charge => ({
          id: charge.id,
          amount: charge.amount / 100,
          status: charge.status,
          receipt_url: charge.receipt_url
        })),
        metadata: paymentIntent.metadata
      }
    };
  } catch (error) {
    console.error('Stripe get payment intent error:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Calculate Stripe fees
 * @param {Number} amount - Amount in dollars
 * @returns {Number} Fee amount in dollars
 */
const calculateStripeFee = (amount) => {
  // Stripe fee structure: 2.9% + $0.30 per transaction
  const feePercentage = 0.029;
  const fixedFee = 0.30;
  return (amount * feePercentage) + fixedFee;
};

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe webhook event
 * @returns {Promise<Object>} Processing result
 */
const handleWebhook = async (event) => {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await handlePaymentSuccess(event.data.object);
      
      case 'payment_intent.payment_failed':
        return await handlePaymentFailed(event.data.object);
      
      case 'charge.refunded':
        return await handleRefund(event.data.object);
      
      default:
        return {
          success: true,
          message: `Unhandled event type: ${event.type}`
        };
    }
  } catch (error) {
    console.error('Stripe webhook handling error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const orderId = paymentIntent.metadata?.order_id;
    if (!orderId) {
      return { success: false, error: 'Order ID not found in metadata' };
    }

    // Find or create transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        gateway_transaction_id: paymentIntent.id,
        order_id: parseInt(orderId)
      }
    });

    const gatewayFee = calculateStripeFee(paymentIntent.amount / 100);
    const netAmount = (paymentIntent.amount / 100) - gatewayFee;

    if (transaction) {
      // Update existing transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          gateway_response: JSON.stringify(paymentIntent),
          gateway_fee: gatewayFee,
          net_amount: netAmount,
          processed_at: new Date()
        }
      });
    } else {
      // Create new transaction
      const generateTransactionNumber = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `TXN-${timestamp}-${random}`;
      };

      await prisma.transaction.create({
        data: {
          transaction_number: generateTransactionNumber(),
          order_id: parseInt(orderId),
          user_id: parseInt(paymentIntent.metadata?.user_id || 0),
          type: 'payment',
          status: 'completed',
          payment_method: 'stripe',
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          gateway_transaction_id: paymentIntent.id,
          gateway_response: JSON.stringify(paymentIntent),
          gateway_fee: gatewayFee,
          net_amount: netAmount,
          processed_at: new Date()
        }
      });
    }

    // Update order payment status
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        payment_status: 'paid',
        payment_id: paymentIntent.id
      }
    });

    return { success: true, message: 'Payment processed successfully' };
  } catch (error) {
    console.error('Error handling payment success:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (paymentIntent) => {
  try {
    const orderId = paymentIntent.metadata?.order_id;
    if (!orderId) return { success: false, error: 'Order ID not found' };

    const transaction = await prisma.transaction.findFirst({
      where: {
        gateway_transaction_id: paymentIntent.id
      }
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          gateway_response: JSON.stringify(paymentIntent)
        }
      });
    }

    return { success: true, message: 'Payment failure recorded' };
  } catch (error) {
    console.error('Error handling payment failure:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle refund
 */
const handleRefund = async (charge) => {
  try {
    // Find the original transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        gateway_transaction_id: charge.payment_intent
      }
    });

    if (transaction) {
      // Create refund transaction
      const generateTransactionNumber = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `TXN-${timestamp}-${random}`;
      };

      await prisma.transaction.create({
        data: {
          transaction_number: generateTransactionNumber(),
          order_id: transaction.order_id,
          user_id: transaction.user_id,
          type: charge.amount === transaction.amount * 100 ? 'refund' : 'partial_refund',
          status: 'completed',
          payment_method: 'stripe',
          amount: charge.amount / 100,
          currency: charge.currency.toUpperCase(),
          gateway_transaction_id: charge.id,
          gateway_response: JSON.stringify(charge),
          processed_at: new Date()
        }
      });

      // Update order if full refund
      if (charge.amount === transaction.amount * 100) {
        await prisma.order.update({
          where: { id: transaction.order_id },
          data: {
            payment_status: 'refunded'
          }
        });
      }
    }

    return { success: true, message: 'Refund processed' };
  } catch (error) {
    console.error('Error handling refund:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getStripeClient,
  createPaymentIntent,
  confirmPaymentIntent,
  createRefund,
  getPaymentIntent,
  calculateStripeFee,
  handleWebhook
};

