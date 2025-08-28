# 1.1 Integration Architecture Mapping

> **Strategic Analysis: Optimal Pagar.me Integration Pattern for EVIDENS**  
> *Source: [Pagar.me Documentation Overview](https://docs.pagar.me/docs/)*

## 🎯 **Executive Summary**

For EVIDENS' subscription-based business model with marketplace features, the **PSP (Payment Service Provider) model** is the optimal choice. This enables maximum delegation to Pagar.me's native features while providing the flexibility needed for complex revenue sharing and subscription management.

---

## 🏗️ **PSP vs Gateway Model Analysis**

### **PSP Model (Recommended)**
**Source**: [Pagar.me Product Philosophy](https://docs.pagar.me/docs/bem-vindo-ao-pagarme)

**What it is**: Pagar.me acts as both payment processor AND financial intermediary, combining gateway advantages with PSP benefits for higher conversion rates.

#### **✅ Advantages for EVIDENS**
1. **Higher Conversion Rates**: Optimized for Brazilian market
2. **Built-in Anti-fraud**: Integrated fraud detection without additional setup
3. **Simplified Integration**: Single relationship, less complexity
4. **Native Split Payments**: Essential for marketplace revenue sharing
5. **Comprehensive Reporting**: Built-in financial dashboards
6. **Automatic Reconciliation**: Streamlined financial operations

#### **⚠️ Considerations**
- Pagar.me handles funds settlement (vs direct to merchant account in Gateway)
- Less control over acquirer selection (handled by Pagar.me)

### **Gateway Model (Alternative)**
**Source**: [Gateway vs PSP Comparison](https://docs.pagar.me/docs/bem-vindo-ao-pagarme)

**What it is**: Pagar.me acts as a technical bridge between EVIDENS and multiple acquirers (Cielo, Rede, Stone).

#### **✅ Advantages**
- Direct settlement to merchant bank account
- Full control over acquirer relationships
- Potentially lower transaction costs at scale

#### **❌ Disadvantages for EVIDENS**
- Complex setup requiring individual acquirer relationships
- Manual split payment implementation required
- Limited marketplace functionality
- Higher development complexity
- More compliance requirements

---

## 📋 **Recommended Integration Architecture**

### **Primary Integration Pattern: PSP + API V5 + Hub**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EVIDENS App   │ ←→ │   Pagar.me API  │ ←→ │ Pagar.me Dashboard│
│                 │    │      V5         │    │                 │
│ • User Management│   │ • Payments      │    │ • Configuration │
│ • Content Access│    │ • Subscriptions │    │ • Reporting     │
│ • UI/UX Layer  │     │ • Webhooks      │    │ • Financial Mgmt│
│ • Custom Features│    │ • Split Rules   │    │ • Compliance    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Integration Responsibilities Matrix**

| **Function** | **Pagar.me Native** | **EVIDENS Custom** |
|--------------|-------------------|-------------------|
| **Payment Processing** | ✅ Full handling | ❌ API calls only |
| **Subscription Management** | ✅ Core engine | ✅ User interface |
| **Revenue Sharing** | ✅ Split payments | ✅ Creator management |
| **Customer Data** | ✅ Wallet storage | ✅ App-specific data |
| **Financial Reporting** | ✅ Standard reports | ✅ Custom analytics |
| **Compliance** | ✅ Regulatory handling | ❌ None required |
| **Anti-fraud** | ✅ Built-in protection | ❌ None required |
| **Invoicing** | 🔄 Via eNotas integration | ✅ Trigger automation |

**Legend**: ✅ Primary responsibility, 🔄 Integrated solution, ❌ Not required

---

## 🔧 **Technical Architecture Components**

### **Core API Integration**
**Source**: [API V5 Documentation](https://api.pagar.me/core/v5)

**Base Endpoint**: `https://api.pagar.me/core/v5`

#### **Essential API Resources for EVIDENS**
```javascript
// Primary Objects for EVIDENS Integration
const coreResources = {
  customers: "Customer wallet management",
  orders: "One-time payments and purchases", 
  charges: "Individual payment transactions",
  subscriptions: "Recurring billing engine",
  plans: "Subscription templates",
  recipients: "Marketplace sellers",
  webhooks: "Real-time event notifications"
}
```

### **Authentication Strategy**
**Source**: [API Authentication](https://docs.pagar.me/reference/autenticação-2)

```javascript
// Recommended Key Management
const apiKeys = {
  test: {
    secret: "sk_test_XXXXXXXXXXXXXXXX", // Server-side operations
    public: "pk_test_XXXXXXXXXXXXXXXX"  // Client-side tokenization
  },
  production: {
    secret: "sk_XXXXXXXXXXXXXXXX",      // Server-side operations  
    public: "pk_XXXXXXXXXXXXXXXX"       // Client-side tokenization
  }
}
```

### **Security Implementation**
**Source**: [Security Documentation](https://docs.pagar.me/reference/segurança-1)

#### **Required Security Measures**
1. **IP Allowlist**: Restrict API access to EVIDENS servers
2. **Rate Limiting**: Respect API limits (200 requests/minute for core operations)
3. **Webhook Validation**: Verify webhook authenticity
4. **Token Management**: Secure handling of temporary payment tokens

---

## 📊 **Hub Integration Strategy**

### **Pagar.me Hub Benefits**
**Source**: [Hub Overview](https://docs.pagar.me/docs/overview-hub)

The Hub provides **"one-click integrations"** that eliminate complex manual setup:

#### **For EVIDENS (Lojista)**
- **Simplified Integration**: Pre-configured connections
- **Automatic Authentication**: Hub handles OAuth flows
- **Webhook Setup**: Automated webhook configuration
- **Documentation**: Built-in integration guides

#### **Hub Integration Flow**
1. **Create Hub Account**: Register EVIDENS as merchant
2. **Select Applications**: Choose relevant integrations (e.g., eNotas)
3. **Authorize Connections**: One-click OAuth flows
4. **Configure Webhooks**: Automatic endpoint setup
5. **Retrieve Credentials**: Get AccountID and AccessTokens

---

## 🔄 **Data Flow Architecture**

### **Payment Processing Flow**
```
Customer Payment Request
         ↓
EVIDENS App (UI + Validation)
         ↓
Pagar.me API (Processing)
         ↓
Webhook Response
         ↓
EVIDENS Database Update
         ↓
Customer Access Management
```

### **Subscription Management Flow**
```
Subscription Creation
         ↓
Pagar.me Plan/Subscription API
         ↓
Billing Cycle Management (Automatic)
         ↓
Invoice Generation (Automatic)
         ↓
Payment Processing (Automatic)
         ↓
Webhook Notifications
         ↓
EVIDENS Access Control Updates
```

---

## 🎯 **Decision Matrix: Why PSP Model**

| **Criteria** | **Weight** | **PSP Score** | **Gateway Score** | **Rationale** |
|--------------|------------|---------------|-------------------|---------------|
| **Development Speed** | 10 | 9 | 5 | PSP requires minimal setup vs complex Gateway configuration |
| **Marketplace Features** | 9 | 10 | 3 | Native split payments vs manual implementation |
| **Brazilian Compliance** | 8 | 10 | 6 | Built-in regulatory compliance vs manual handling |
| **Maintenance Overhead** | 8 | 9 | 4 | Single integration vs multiple acquirer relationships |
| **Anti-fraud Integration** | 7 | 10 | 5 | Built-in vs additional service required |
| **Financial Reporting** | 7 | 8 | 5 | Comprehensive dashboard vs custom development |

**Total Score**: PSP (93/100) vs Gateway (59/100)

---

## 📝 **Implementation Recommendations**

### **Phase 1: Foundation Setup**
1. **Create Pagar.me PSP Account**
2. **Configure Hub Integrations** (eNotas, Slack if needed)
3. **Setup Development Environment** with test keys
4. **Implement Basic Payment Flow** (credit card, Pix)
5. **Configure Webhook Endpoints**

### **Phase 2: Subscription Engine**
1. **Create Standard Plans** in Pagar.me Dashboard
2. **Implement Subscription Management** via API
3. **Setup Failed Payment Handling**
4. **Configure Billing Notifications**

### **Phase 3: Marketplace Features**
1. **Recipients Management System**
2. **Split Payment Rules Engine**
3. **Creator Onboarding Workflow**
4. **Revenue Reporting Dashboard**

---

## 🔗 **Key Documentation References**

- **[Pagar.me Product Overview](https://docs.pagar.me/docs/bem-vindo-ao-pagarme)**: PSP vs Gateway explanation
- **[API V5 Base](https://api.pagar.me/core/v5)**: Technical implementation foundation  
- **[Hub Integration](https://docs.pagar.me/docs/overview-hub)**: Simplified integration platform
- **[Security Guidelines](https://docs.pagar.me/reference/segurança-1)**: Essential security measures
- **[Authentication Methods](https://docs.pagar.me/reference/autenticação-2)**: API key management

---

*This architecture analysis establishes the foundation for all subsequent integration decisions and development phases.*