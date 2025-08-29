# Pagar.me Authentication Guide

## Overview

Pagar.me API v5 uses HTTP Basic Authentication with API keys. This guide covers secure authentication implementation for EVIDENS Edge Functions.

## API Keys

### **Key Types & Environments**

| Environment | Secret Key | Public Key | Use Case |
|-------------|------------|------------|----------|
| **Test** | `sk_test_*` | `pk_test_*` | Development, testing |
| **Production** | `sk_*` | `pk_*` | Live transactions |

### **Key Usage Guidelines**

- **Secret Keys**: Server-side only (Edge Functions)
- **Public Keys**: Client-side safe (payment forms, tokenization)  
- **Storage**: Supabase Edge Function environment variables only
- **Security**: Never log, commit, or expose in client code

## Authentication Implementation

### **Edge Function Authentication Pattern**

```typescript
// EVIDENS Standard Authentication Helper
export const authenticatePagarme = (secretKey: string) => {
  const credentials = btoa(`${secretKey}:`); // Username: secretKey, Password: empty
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// Usage in Edge Functions
export default async function handler(req: Request) {
  const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY');
  if (!pagarmeSecretKey) {
    return sendError('Payment service configuration error', 500);
  }

  const headers = authenticatePagarme(pagarmeSecretKey);
  
  const response = await fetch('https://api.pagar.me/core/v5/customers', {
    method: 'POST',
    headers,
    body: JSON.stringify(customerData)
  });
}
```

### **Environment Configuration**

```bash
# Supabase Edge Function Environment Variables
# Test Environment
PAGARME_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXX
PAGARME_PUBLIC_KEY=pk_test_XXXXXXXXXXXXXXXX

# Production Environment  
PAGARME_SECRET_KEY=sk_XXXXXXXXXXXXXXXX
PAGARME_PUBLIC_KEY=pk_XXXXXXXXXXXXXXXX
```

## API Endpoints

### **Base URLs**
- **All Environments**: `https://api.pagar.me/core/v5`
- **Note**: Same endpoint for test and production (differentiated by API keys)

### **Request Headers (Required)**
```http
Authorization: Basic <base64(secret_key:)>
Content-Type: application/json
Accept: application/json
```

## Security Best Practices

### **Network Security**
```typescript
// EVIDENS Edge Function Security Pattern
export const pagarmeSecurityConfig = {
  // Whitelist Pagar.me domain
  allowedDomains: ['api.pagar.me'],
  
  // IP Range Whitelist (for firewall configuration)
  allowedIPs: [
    '52.186.34.80/28',
    '104.45.183.192/28', 
    '52.186.34.84'
  ],
  
  // TLS Requirements
  tlsVersion: 'TLS 1.3', // Recommended (fallback to TLS 1.2)
  encryption: 'SHA256+',   // Minimum 128-bit encryption
};
```

### **Credential Management**
- **[CRITICAL]** Never hardcode API keys
- **[REQUIRED]** Use Supabase environment variables
- **[SECURITY]** Rotate keys regularly (quarterly recommended)
- **[MONITORING]** Log authentication failures (without exposing keys)

### **Error Handling**
```typescript
// Authentication Error Pattern
const handleAuthError = (response: Response) => {
  if (response.status === 401) {
    console.error('Pagar.me authentication failed - check API keys');
    return sendError('Payment service authentication error', 500);
  }
  
  if (response.status === 403) {
    console.error('Pagar.me API access forbidden - check permissions');
    return sendError('Payment service access denied', 500);
  }
};
```

## Rate Limiting

### **Standard Limits**
- **Most GET endpoints**: 200 requests/minute
- **Webhook endpoints**: 50 requests/minute  
- **Recipient endpoints**: 100-150 requests/minute

### **Rate Limit Handling**
```typescript
// EVIDENS Rate Limit Handler
export const handleRateLimit = async (response: Response) => {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.warn(`Pagar.me rate limit hit. Retry after: ${retryAfter}s`);
    
    // Implement exponential backoff
    const delay = parseInt(retryAfter || '60') * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return true; // Indicate retry needed
  }
  return false; // No retry needed
};
```

## Testing Authentication

### **Validation Commands**
```bash
# Test authentication with curl
curl -X GET https://api.pagar.me/core/v5/customers \
  -H "Authorization: Basic $(echo -n 'sk_test_YOUR_KEY:' | base64)" \
  -H "Content-Type: application/json"

# Expected: 200 OK with customer list or empty array
```

### **Edge Function Testing**
```typescript
// Test Edge Function Authentication
export const testPagarmeAuth = async () => {
  try {
    const response = await fetch(SUPABASE_EDGE_FUNCTION_URL + '/test-pagarme-auth', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supabase_anon_key}` }
    });
    
    console.log('Authentication test:', response.status === 200 ? 'PASS' : 'FAIL');
  } catch (error) {
    console.error('Authentication test failed:', error);
  }
};
```

## Error Codes Reference

| Status | Meaning | Action |
|--------|---------|---------|
| `401` | Invalid API key | Verify environment variables |
| `403` | Insufficient permissions | Check API key scope |
| `429` | Rate limit exceeded | Implement exponential backoff |
| `500` | Pagar.me server error | Log incident, retry with delay |

## Integration Checklist

- [ ] API keys configured in Supabase environment
- [ ] Authentication helper implemented in Edge Functions
- [ ] Rate limiting handler implemented
- [ ] Error handling patterns established
- [ ] Network security (IP whitelist) configured
- [ ] TLS 1.3 verified
- [ ] Authentication testing completed

---

**Next Steps**: 
1. [Customer Management](./api-reference/customers.md) - Learn customer creation patterns
2. [Payment Processing](./api-reference/orders.md) - Implement order workflows
3. [PIX Integration](./payment-methods/pix.md) - Complete PIX implementation