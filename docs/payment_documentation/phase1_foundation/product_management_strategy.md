# 1.2 Product Management Strategy Analysis

> **Strategic Framework: Flexible Subscription & Offers Management**  
> *Sources: [Plans](https://docs.pagar.me/reference/planos-1), [Subscriptions](https://docs.pagar.me/reference/assinaturas-1), [Metadata](https://docs.pagar.me/reference/metadata-1)*

## 🎯 **Executive Summary**

EVIDENS requires a **hybrid approach** combining Pagar.me's native Plans for standard offerings with custom metadata for flexible access time management and dynamic offers. This enables rapid deployment while maintaining the flexibility needed for diverse subscription models.

---

## 🏗️ **Product Architecture Strategy**

### **Core Philosophy: "Template + Customization"**

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Pagar.me Plans    │    │  EVIDENS Metadata   │    │  Custom UI Layer    │
│                     │    │                     │    │                     │
│ • Standard pricing  │ +  │ • Access duration   │ =  │ • User-friendly     │
│ • Billing cycles   │    │ • Custom attributes │    │   configuration     │
│ • Payment methods   │    │ • Discount rules    │    │ • Flexible offers   │
│ • Base compliance   │    │ • Group settings    │    │ • Dynamic pricing   │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 📋 **Plans vs Standalone Subscriptions Analysis**

### **Recommended Approach: Hybrid Model**
**Sources**: [Plans Overview](https://docs.pagar.me/reference/planos-1), [Subscriptions](https://docs.pagar.me/reference/assinaturas-1)

#### **Use Plans For:**
✅ **Standard Offerings** (Monthly, Annual subscriptions)  
✅ **Common Payment Methods** (Credit Card, Pix, Boleto)  
✅ **Base Pricing Structure**  
✅ **Compliance Templates**

#### **Use Standalone Subscriptions For:**
✅ **Custom Access Periods** (3 months, 6 months, etc.)  
✅ **Group/Batch Subscriptions**  
✅ **Special Promotional Offers**  
✅ **One-time Custom Arrangements**

---

## 🔧 **Technical Implementation Strategy**

### **Plan Structure Design**
**Source**: [Plan Object Attributes](https://docs.pagar.me/reference/planos-1)

```javascript
// Recommended Plan Template Structure
const evidensBasePlans = {
  monthly: {
    name: "EVIDENS Monthly Access",
    interval: "month",
    interval_count: 1,
    billing_type: "prepaid",
    payment_methods: ["credit_card", "pix", "boleto"],
    // Base price - customized through metadata
    items: [
      {
        description: "Monthly Platform Access",
        quantity: 1,
        pricing_scheme: {
          scheme_type: "unit",
          price: 0 // Will be overridden by subscription-specific pricing
        }
      }
    ]
  },
  
  annual: {
    name: "EVIDENS Annual Access", 
    interval: "month",
    interval_count: 12,
    billing_type: "prepaid",
    payment_methods: ["credit_card", "pix", "boleto"],
    // Annual discount built into base plan
  }
};
```

### **Metadata Strategy for Flexibility**
**Source**: [Metadata Object](https://docs.pagar.me/reference/metadata-1)

```javascript
// Custom Metadata Schema for EVIDENS
const evidensSubscriptionMetadata = {
  // Access Management
  access_duration_months: "6", // Custom duration
  access_type: "premium", // standard, premium, group
  
  // Offer Management  
  offer_type: "discount_coupon", // regular, discount_coupon, batch_group
  discount_percentage: "20",
  discount_code: "EARLY2025",
  
  // Group Management
  group_id: "batch_university_2025",
  group_size: "50",
  group_discount: "30",
  
  // Custom Attributes
  content_access_level: "full", // basic, full, premium
  download_allowance: "unlimited",
  support_level: "priority",
  
  // Internal Management
  internal_product_id: "EVIDENS_CUSTOM_001",
  created_by_admin: "admin_user_123",
  custom_notes: "Special pricing for partner organization"
};
```

---

## 🎨 **Flexible Offers Implementation**

### **Discount & Coupon System**
**Sources**: [Discounts](https://docs.pagar.me/reference/desconto-1), [Subscription Items](https://docs.pagar.me/reference/item-da-assinatura-1)

#### **Approach 1: Native Pagar.me Discounts**
```javascript
// For standard percentage/fixed discounts
const subscriptionWithDiscount = {
  plan_id: "plan_monthly_base",
  customer_id: "cus_customer_123", 
  discounts: [
    {
      discount_type: "percentage",
      value: 2000, // 20%
      cycles: 3, // Apply for first 3 months
      description: "Early subscriber discount"
    }
  ],
  metadata: {
    discount_code: "EARLY20",
    original_price: "9900"
  }
};
```

#### **Approach 2: Custom Pricing with Metadata**
```javascript
// For complex custom offers
const customOfferSubscription = {
  // Create without plan - fully custom
  items: [
    {
      description: "Custom EVIDENS Access - 6 months",
      quantity: 1,
      pricing_scheme: {
        scheme_type: "unit", 
        price: 7900 // Custom price for 6-month access
      },
      cycles: 6 // Limited duration
    }
  ],
  metadata: {
    offer_type: "custom_duration",
    access_duration_months: "6",
    discount_applied: "batch_group_30",
    original_monthly_price: "1900"
  }
};
```

### **Batch/Group Subscriptions**
**Source**: [Multicompradores](https://docs.pagar.me/docs/multicompradores)

#### **Recommended Approach: Master Subscription + Individual Access**
```javascript
// Master subscription for organization
const groupMasterSubscription = {
  items: [
    {
      description: "EVIDENS Group Access - 50 users",
      quantity: 50,
      pricing_scheme: {
        scheme_type: "unit",
        price: 1330 // 30% discount per user (R$ 13.30 vs R$ 19.00)
      }
    }
  ],
  metadata: {
    subscription_type: "group_master",
    group_size: "50",
    group_admin_email: "admin@university.edu",
    individual_access_duration: "12"
  }
};

// Individual access records (in EVIDENS database)
const groupMemberAccess = {
  master_subscription_id: "sub_group_master_123",
  user_email: "student@university.edu", 
  access_granted_date: "2025-01-20",
  access_expires_date: "2026-01-20",
  access_status: "active"
};
```

---

## ⚙️ **Access Time Customization Strategy**

### **Implementation Pattern: Metadata + Custom Logic**

#### **Standard Durations via Plans**
- **1 Month**: Plan-based subscription
- **12 Months**: Plan-based subscription with annual discount

#### **Custom Durations via Standalone Subscriptions**
- **3, 6, 9 Months**: Custom subscriptions with specific cycles
- **Custom Periods**: Fully flexible standalone subscriptions

```javascript
// Custom Duration Implementation
const customDurationSubscription = {
  interval: "month",
  interval_count: 1,
  billing_type: "prepaid", 
  cycles: customMonths, // 3, 6, 9, etc.
  items: [
    {
      description: `EVIDENS Access - ${customMonths} months`,
      quantity: 1,
      pricing_scheme: {
        scheme_type: "unit",
        price: calculateCustomPrice(customMonths)
      }
    }
  ],
  metadata: {
    access_type: "custom_duration",
    total_duration_months: customMonths.toString(),
    price_per_month: calculateMonthlyRate(customMonths),
    bulk_discount_applied: calculateBulkDiscount(customMonths)
  }
};
```

---

## 📊 **Pricing Strategy Framework**

### **Dynamic Pricing Calculator**
```javascript
// Pricing logic for custom offers
const pricingCalculator = {
  baseMonthlyPrice: 1900, // R$ 19.00
  
  // Duration-based discounts
  durationDiscounts: {
    1: 0,    // No discount for 1 month
    3: 5,    // 5% discount for 3 months
    6: 10,   // 10% discount for 6 months  
    12: 20   // 20% discount for 12 months
  },
  
  // Group size discounts
  groupDiscounts: {
    "10-24": 10,   // 10% discount for 10-24 users
    "25-49": 20,   // 20% discount for 25-49 users
    "50+": 30      // 30% discount for 50+ users
  },
  
  calculatePrice(duration, groupSize = 1, couponCode = null) {
    let price = this.baseMonthlyPrice;
    
    // Apply duration discount
    if (this.durationDiscounts[duration]) {
      price *= (100 - this.durationDiscounts[duration]) / 100;
    }
    
    // Apply group discount
    const groupTier = this.getGroupTier(groupSize);
    if (this.groupDiscounts[groupTier]) {
      price *= (100 - this.groupDiscounts[groupTier]) / 100;
    }
    
    // Apply coupon discount
    if (couponCode) {
      price *= (100 - this.getCouponDiscount(couponCode)) / 100;
    }
    
    return Math.round(price * duration); // Total price for duration
  }
};
```

---

## 🔄 **Subscription Management UI Strategy**

### **Admin Interface Requirements**
**For Internal EVIDENS Management**

#### **Plan Management Screen**
- **View Active Plans**: List all Pagar.me plans
- **Create Custom Offers**: Generate standalone subscriptions
- **Pricing Calculator**: Real-time price calculation
- **Bulk Operations**: Create group subscriptions

#### **Customer Management Screen**  
- **Subscription Overview**: Current access status
- **Access Modification**: Extend/modify access periods
- **Offer Application**: Apply discounts and coupons
- **Group Management**: Manage group memberships

#### **Offers Management Screen**
- **Coupon Creation**: Generate discount codes
- **Batch Pricing**: Setup group discounts
- **Custom Durations**: Configure special access periods
- **Analytics**: Track offer performance

### **Customer-Facing Interface**
**For End-User Experience**

```javascript
// Customer subscription options UI
const customerOfferOptions = {
  standard: {
    monthly: {
      price: "R$ 19,90/mês",
      description: "Acesso mensal completo",
      payment_methods: ["credit_card", "pix", "boleto"]
    },
    annual: {
      price: "R$ 191,04/ano", // 20% discount
      description: "Plano anual com desconto",
      savings: "R$ 47,76 de economia"
    }
  },
  
  custom: {
    sixMonths: {
      price: "R$ 107,46", // 10% discount  
      description: "6 meses de acesso",
      savings: "R$ 12,54 de economia"
    },
    group: {
      price: "Consulte condições especiais",
      description: "Desconto para grupos",
      contact_required: true
    }
  }
};
```

---

## 📝 **Implementation Priority Matrix**

| **Feature** | **Priority** | **Implementation** | **Timeline** |
|-------------|-------------|-------------------|-------------|
| **Basic Monthly/Annual Plans** | HIGH | Pagar.me Native Plans | Week 1-2 |
| **Custom Duration Subscriptions** | HIGH | Standalone Subscriptions | Week 2-3 |
| **Metadata Management** | HIGH | Custom Database + API | Week 2-3 |
| **Discount/Coupon System** | MEDIUM | Native Discounts + Custom Logic | Week 3-4 |
| **Group Subscriptions** | MEDIUM | Master Sub + Individual Tracking | Week 4-5 |
| **Admin Management UI** | MEDIUM | Custom Dashboard | Week 4-6 |
| **Advanced Offer Analytics** | LOW | Custom Reporting | Week 6+ |

---

## 🔗 **Key Documentation References**

- **[Plans Object Reference](https://docs.pagar.me/reference/planos-1)**: Template-based subscriptions
- **[Subscriptions Object Reference](https://docs.pagar.me/reference/assinaturas-1)**: Custom subscription management  
- **[Metadata Object Reference](https://docs.pagar.me/reference/metadata-1)**: Flexible data storage
- **[Discounts Reference](https://docs.pagar.me/reference/desconto-1)**: Native discount functionality
- **[Multicompradores](https://docs.pagar.me/docs/multicompradores)**: Group payment scenarios

---

*This product management strategy enables maximum flexibility while leveraging Pagar.me's native capabilities for rapid deployment and minimal custom development.*