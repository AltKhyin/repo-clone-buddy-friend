# EVIDENS Payment Integration Documentation

**Version**: 3.0  
**Last Updated**: August 29, 2025  
**Status**: Production-Ready

## Overview

This documentation provides comprehensive, authoritative guidance for integrating Pagar.me payment services into the EVIDENS platform. Built from official Pagar.me API documentation and optimized for EVIDENS architectural patterns.

## 🎯 Quick Start

### For Developers
```typescript
// 1. Create customer and process PIX payment
import { createPixPayment } from '@/hooks/mutations/usePaymentMutations'

const payment = await createPixPayment({
  customerId: 'existing_or_new',
  amount: 1990, // R$ 19.90 in cents
  description: 'EVIDENS - Plano Mensal'
})
```

### For Product/Business 
- **PIX**: Instant, no fees, QR code + copy/paste
- **Credit Card**: 1-12x installments, higher conversion
- **Boleto**: 2-3 business days, bank slip
- **Subscriptions**: Automated recurring billing

## 📚 Documentation Structure

### **Core API Reference**
- **[Authentication](./api-reference/authentication.md)** - API keys, security, headers
- **[Customers](./api-reference/customers.md)** - Create, update, manage customers  
- **[Orders](./api-reference/orders.md)** - Order creation, items, validation
- **[Charges](./api-reference/charges.md)** - Payment processing, status handling
- **[Webhooks](./api-reference/webhooks.md)** - Event handling, security verification

### **Payment Methods**
- **[PIX](./payment-methods/pix.md)** ✅ *Currently Implemented*
- **[Credit Card](./payment-methods/credit-card.md)** 🚧 *Implementation Ready*
- **[Boleto](./payment-methods/boleto.md)** 📋 *Documentation Only*
- **[Method Comparison](./payment-methods/comparison-guide.md)** - Choose the right method

### **Subscriptions & Recurring**
- **[Plans](./subscriptions/plans.md)** - Subscription plan management
- **[Lifecycle](./subscriptions/lifecycle.md)** - Billing cycles, renewals, cancellations
- **[Customer Management](./subscriptions/customer-management.md)** - Subscription customer patterns

### **Advanced Features** 
- **[Split Payments](./advanced/split-payments.md)** - Marketplace revenue sharing
- **[Marketplace](./advanced/marketplace.md)** - Multi-recipient transactions
- **[Antifraude](./advanced/fraud-prevention.md)** - Security and risk management

### **EVIDENS Integration Patterns**
- **[Edge Functions](./edge-functions/)** - Backend payment processing templates
- **[Frontend Patterns](./frontend-patterns/)** - TanStack Query, form validation
- **[Error Handling](./integration/error-handling.md)** - Comprehensive error management
- **[Testing Strategies](./integration/testing.md)** - Payment testing best practices

## 🔒 Security Guidelines

### **API Keys Management**
- **Test**: `sk_test_*` / `pk_test_*`
- **Production**: `sk_*` / `pk_*` 
- **Storage**: Supabase Edge Function environment variables only

### **Data Protection**
- Never log sensitive payment data
- Use tokenization for card storage
- Validate all inputs with Zod schemas
- Follow PCI compliance guidelines

### **Network Security**
- Whitelist domain: `api.pagar.me`
- IP ranges: `52.186.34.80/28`, `104.45.183.192/28`
- TLS 1.2+ required (TLS 1.3 recommended)
- SHA256+ encryption

## 📊 Payment Method Decision Matrix

| Method | Conversion | Speed | Fees | Best For |
|--------|------------|-------|------|----------|
| **PIX** | High | Instant | Free | Mobile users, immediate access |
| **Credit Card** | Highest | Instant | ~3-4% | Premium plans, installments |
| **Boleto** | Medium | 2-3 days | ~R$2-4 | Traditional users, no credit card |

## 🚀 Implementation Status

### ✅ **Production Ready**
- PIX payment processing
- Customer creation and management
- Webhook event handling
- Payment form UI (TwoStepPaymentForm)

### 🚧 **Development Ready**  
- Credit card tokenization and processing
- Subscription plan management
- Boleto generation and tracking

### 📋 **Planned Features**
- Split payment marketplace functionality
- Advanced fraud prevention
- Multi-recipient transactions

## 🔧 Development Commands

```bash
# Test payment integration
npm run test:payments

# Deploy payment edge functions  
npx supabase functions deploy create-pix-payment
npx supabase functions deploy pagarme-webhook

# Validate payment schemas
npm run validate:payment-schemas
```

## 📞 Support & Resources

- **Pagar.me Official Docs**: https://docs.pagar.me/
- **EVIDENS Payment Issues**: Internal issue tracking
- **Technical Support**: [email protected]
- **Integration Support**: Internal development team

---

*This documentation follows EVIDENS architectural principles: maximum reuse, minimal complexity, comprehensive testing, and security-first implementation.*