# 🔗 Stripe Webhook Setup Guide

## Development (Local Testing)

For local development, you have 2 options:

### Option 1: Use Placeholder (Current Setup) ✅
The `.env` file is configured with a placeholder webhook secret:
```
STRIPE_WEBHOOK_SECRET="whsec_dev_placeholder_for_local_testing_only"
```

**Pros:**
- ✅ Server works without errors
- ✅ No additional setup needed

**Cons:**
- ⚠️ Webhooks won't actually trigger
- ⚠️ Payment confirmations won't be automatic

### Option 2: Use Stripe CLI
```bash
# Install Stripe CLI (already done)
~/.local/bin/stripe --version

# Login to Stripe
~/.local/bin/stripe login

# Start webhook listener
~/.local/bin/stripe listen --forward-to localhost:3000/api/payments/webhook

# Copy the webhook secret that appears (whsec_...)
# Update .env with the real secret
```

---

## Production Setup (Required for Live Site)

When you deploy to production, follow these steps:

### Step 1: Access Stripe Dashboard
Go to: https://dashboard.stripe.com/webhooks

(Use test mode during testing, live mode for production)

### Step 2: Create Webhook Endpoint

1. Click **"Add endpoint"**
2. Configure:
   - **Endpoint URL**: `https://yourdomain.com/api/payments/webhook`
   - **Description**: "Malmequer Payment Webhooks"

### Step 3: Select Events

Select these events:
- ✅ `payment_intent.succeeded` - Payment successful
- ✅ `payment_intent.payment_failed` - Payment failed
- ✅ `charge.succeeded` - Charge successful (for MB WAY/Multibanco)

### Step 4: Get Signing Secret

1. After creating the endpoint, scroll to **"Signing secret"**
2. Click **"Reveal"**
3. Copy the secret (starts with `whsec_...`)

### Step 5: Update Production Environment

Add to your production `.env`:
```
STRIPE_WEBHOOK_SECRET="whsec_your_real_production_secret_here"
```

### Step 6: Test the Webhook

1. In Stripe Dashboard, go to your webhook endpoint
2. Click **"Send test webhook"**
3. Select event: `payment_intent.succeeded`
4. Check your server logs to confirm receipt

---

## How Webhooks Work

```
1. Customer completes payment on your site
   ↓
2. Stripe processes payment
   ↓
3. Stripe sends webhook to: https://yourdomain.com/api/payments/webhook
   ↓
4. Your server validates the webhook signature
   ↓
5. Your server updates order status to PAID
   ↓
6. Your server sends confirmation email to customer
   ↓
7. Customer sees success page
```

---

## Webhook Endpoint Details

**File:** `/app/api/payments/webhook/route.ts`

**Handled Events:**
- `payment_intent.succeeded` → Updates order to PAID, sends confirmation email
- `payment_intent.payment_failed` → Updates order to FAILED
- `charge.succeeded` → Handles MB WAY/Multibanco payments

**Security:**
- Validates webhook signature using `STRIPE_WEBHOOK_SECRET`
- Rejects invalid/tampered webhooks
- Logs all webhook events

---

## Troubleshooting

### Webhook not receiving events
1. Check webhook URL is publicly accessible
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check Stripe Dashboard > Webhooks > Recent events

### Signature validation fails
1. Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Don't modify webhook request body
3. Check server time is synchronized (webhooks include timestamp)

### Events not processing
1. Check server logs for errors
2. Verify order exists in database
3. Ensure email service (Resend) is configured

---

## Testing Webhooks Locally

### Using Stripe CLI:
```bash
# Terminal 1: Start your dev server
pnpm dev

# Terminal 2: Start Stripe CLI listener
~/.local/bin/stripe listen --forward-to localhost:3000/api/payments/webhook

# Terminal 3: Trigger test events
~/.local/bin/stripe trigger payment_intent.succeeded
```

### Using ngrok (alternative):
```bash
# Start ngrok tunnel
ngrok http 3000

# Use ngrok URL in Stripe webhook:
# https://abc123.ngrok.io/api/payments/webhook
```

---

## Production Checklist

Before going live:

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` configured in production `.env`
- [ ] Webhook URL uses HTTPS (not HTTP)
- [ ] Test webhook sends successfully
- [ ] Email notifications are working
- [ ] Database updates on payment success
- [ ] Order status changes correctly

---

## Support

If you need help:
- Stripe Documentation: https://stripe.com/docs/webhooks
- Stripe CLI Docs: https://stripe.com/docs/stripe-cli
- Test your webhooks: https://dashboard.stripe.com/test/webhooks
