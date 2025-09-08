# Webhook Authentication Credentials

## Pagar.me Webhook Configuration

### Basic Authentication Credentials
- **Username**: `Reviews`
- **Password**: `#Pipoquinha12`

### Environment Variables (Optional Override)
```bash
PAGARME_WEBHOOK_USER=Reviews
PAGARME_WEBHOOK_PASSWORD=#Pipoquinha12
PAGARME_SECRET_KEY=sk_test_XXXXXXXXXX  # Your API secret key
```

### Authentication Methods Supported (in Priority Order)
1. **Bearer Token** - Uses `PAGARME_SECRET_KEY` 
2. **Basic Auth** - Uses credentials above
3. **HMAC Signature** - Uses `PAGARME_WEBHOOK_SECRET` if configured

### Security Notes
- These credentials are hardcoded as fallback in the webhook function
- Environment variables can override the hardcoded values
- Store this file securely and don't commit to public repositories
- The webhook function logs authentication attempts for debugging

### Webhook URL
```
https://qjoxiowuiiupbvqlssgk.supabase.co/functions/v1/pagarme-webhook
```

## Generated Basic Auth Header
For reference, the Basic Auth header should be:
```
Authorization: Basic UmV2aWV3czojUGlwb3F1aW5oYTEy
```
(Base64 encoding of "Reviews:#Pipoquinha12")