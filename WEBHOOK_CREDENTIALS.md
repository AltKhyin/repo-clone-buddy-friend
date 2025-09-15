# Webhook Authentication Credentials

## Pagar.me Webhook Configuration

### Basic Authentication Credentials
- **Username**: Set via environment variable `PAGARME_WEBHOOK_USER`
- **Password**: Set via environment variable `PAGARME_WEBHOOK_PASSWORD`

### Required Environment Variables
```bash
PAGARME_WEBHOOK_USER=your_webhook_username_here
PAGARME_WEBHOOK_PASSWORD=your_webhook_password_here
PAGARME_SECRET_KEY=your_pagarme_secret_key_here
```

### Authentication Methods Supported (in Priority Order)
1. **Bearer Token** - Uses `PAGARME_SECRET_KEY` 
2. **Basic Auth** - Uses credentials above
3. **HMAC Signature** - Uses `PAGARME_WEBHOOK_SECRET` if configured

### Security Notes
- All credentials must be set via environment variables
- No fallback credentials are provided in code
- Store this file securely and don't commit to public repositories
- The webhook function validates all authentication attempts

### Webhook URL
```
https://qjoxiowuiiupbvqlssgk.supabase.co/functions/v1/pagarme-webhook-v2
```

## Generated Basic Auth Header
The Basic Auth header will be generated from your environment variables:
```
Authorization: Basic <base64_encoded_username:password>
```