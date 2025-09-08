# Pagar.me V5 Subscription API Complete Specification

## Overview
Documentation of all required and optional fields for creating standalone subscriptions using Pagar.me V5 API.

**Endpoint:** `POST https://api.pagar.me/core/v5/subscriptions`

## Authentication
- **Method:** Basic Auth
- **Username:** API Secret Key
- **Password:** (empty)
- **Header:** `Authorization: Basic {base64(api_key:)}`

## Request Structure

### Core Required Fields

#### 1. Subscription Configuration
```json
{
  "description": "string", // REQUIRED - Subscription description
  "quantity": 1,           // REQUIRED - Quantity (typically 1 for subscriptions)
  "pricing_scheme": {      // REQUIRED - Pricing configuration
    "scheme_type": "unit", // REQUIRED - For simple unit pricing
    "price": 0            // REQUIRED - Price in cents
  },
  "interval": "month",     // REQUIRED - Billing interval: day, week, month, year
  "interval_count": 1,     // REQUIRED - Interval multiplier (e.g., 2 = every 2 months)
  "billing_type": "prepaid" // REQUIRED - prepaid, postpaid, exact_day
}
```

#### 2. Customer Information
```json
{
  "customer": {
    "name": "string",        // REQUIRED - Full name
    "email": "string",       // REQUIRED - Valid email
    "document": "string",    // REQUIRED - CPF/CNPJ (numbers only)
    "phone": "string",       // REQUIRED - Phone (numbers only)
    "type": "individual"     // REQUIRED - individual or company
  }
}
```

#### 3. Payment Method Configuration

**For Credit Card:**
```json
{
  "payment_method": "credit_card", // REQUIRED
  "card": {
    "number": "string",            // REQUIRED - Card number
    "holder_name": "string",       // REQUIRED - Cardholder name
    "exp_month": "string",         // REQUIRED - Expiration month (MM)
    "exp_year": "string",          // REQUIRED - Expiration year (YYYY)
    "cvv": "string",              // REQUIRED - CVV
    "billing_address": {           // REQUIRED - Billing address
      "line_1": "string",          // REQUIRED - Street address
      "zip_code": "string",        // REQUIRED - ZIP code
      "city": "string",            // REQUIRED - City
      "state": "string",           // REQUIRED - State
      "country": "string"          // REQUIRED - Country code
    }
  },
  "installments": 1              // OPTIONAL - Number of installments
}
```

**For Boleto:**
```json
{
  "payment_method": "boleto"
}
```

#### 4. Optional Fields
```json
{
  "start_at": "2024-01-01T00:00:00Z", // OPTIONAL - Start date (ISO 8601)
  "minimum_price": 0,                 // OPTIONAL - Minimum price in cents
  "metadata": {                       // OPTIONAL - Custom metadata
    "evidens_plan_id": "string",
    "evidens_customer_id": "string",
    "evidens_plan_name": "string",
    "flow_type": "standalone_subscription"
  }
}
```

## Complete Payload Example

```json
{
  "description": "Assinatura Teste Daily",
  "quantity": 1,
  "pricing_scheme": {
    "scheme_type": "unit",
    "price": 990
  },
  "interval": "month",
  "interval_count": 1,
  "billing_type": "prepaid",
  "customer": {
    "name": "João Silva",
    "email": "joao@example.com",
    "document": "12345678901",
    "phone": "11999999999",
    "type": "individual"
  },
  "payment_method": "credit_card",
  "card": {
    "number": "4000000000000010",
    "holder_name": "JOAO SILVA",
    "exp_month": "12",
    "exp_year": "2025",
    "cvv": "123",
    "billing_address": {
      "line_1": "Rua das Flores, 123",
      "zip_code": "01234567",
      "city": "São Paulo",
      "state": "SP",
      "country": "BR"
    }
  },
  "installments": 1,
  "metadata": {
    "evidens_plan_id": "8d1cb477-c57c-43a7-810a-36496de4d7f4",
    "evidens_customer_id": "customer-123",
    "evidens_plan_name": "Teste Daily",
    "flow_type": "standalone_subscription"
  }
}
```

## Validation Rules

### Document Field
- **Format:** Numbers only (remove all formatting)
- **CPF:** 11 digits
- **CNPJ:** 14 digits
- **Validation:** Must be valid Brazilian document

### Phone Field
- **Format:** Numbers only (remove all formatting)
- **Length:** Typically 10-11 digits for Brazilian numbers

### Card Fields
- **Number:** 13-19 digits
- **Expiration Month:** MM format (01-12)
- **Expiration Year:** YYYY format
- **CVV:** 3-4 digits
- **Holder Name:** Uppercase recommended

### Address Fields
- **ZIP Code:** 8 digits for Brazilian addresses
- **State:** 2-letter state code (e.g., "SP", "RJ")
- **Country:** 2-letter country code ("BR" for Brazil)

## Response Structure

### Success Response (201 Created)
```json
{
  "id": "sub_xxxxxxxxxx",
  "status": "active",
  "current_cycle": {
    "start_at": "2024-01-01T00:00:00Z",
    "end_at": "2024-02-01T00:00:00Z"
  },
  "next_billing_at": "2024-02-01T00:00:00Z",
  "customer": { ... },
  "pricing_scheme": { ... }
}
```

### Error Response (400 Bad Request)
```json
{
  "errors": {
    "field_name": ["Error message"]
  },
  "message": "Validation failed"
}
```

## Common Errors

1. **"The quantity field is required"** - Missing quantity field
2. **"The description field is required"** - Missing description field  
3. **"The document field is not a valid number"** - Document contains formatting
4. **"The price_brackets field is required only if..."** - Remove price_brackets for unit pricing
5. **"Invalid card data"** - Check card number, expiration, CVV format

## Implementation Notes

1. **Field Sanitization:** Always clean document and phone fields before sending
2. **Error Handling:** Parse error responses and provide user-friendly messages
3. **Logging:** Log requests for debugging (exclude sensitive card data)
4. **Validation:** Validate data on both frontend and backend
5. **Testing:** Test with pagar.me sandbox environment first

## References

- [Pagar.me V5 API Documentation](https://docs.pagar.me/)
- [Criar Assinatura Avulsa](https://docs.pagar.me/reference/criar-assinatura-avulsa)
- [Authentication Documentation](https://docs.pagar.me/reference/getting-started-with-your-api)