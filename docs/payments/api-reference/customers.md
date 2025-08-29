# Pagar.me Customer Management Guide

## Overview

The Pagar.me Customer API provides comprehensive customer lifecycle management for the EVIDENS platform. This guide covers customer creation, profile management, and integration with EVIDENS authentication patterns.

## Customer Object Structure

### **Core Customer Fields**

```typescript
interface PagarmeCustomer {
  id: string;                    // Pagar.me customer ID
  name: string;                  // Full customer name
  email: string;                 // Unique customer email
  document: string;              // CPF (11 digits) or CNPJ (14 digits)  
  document_type: 'cpf' | 'cnpj'; // Brazilian document type
  type: 'individual' | 'company'; // Customer type
  phone_numbers: string[];       // Phone numbers array
  birthday?: string;             // Format: YYYY-MM-DD
  gender?: 'male' | 'female';    // Optional gender
  address?: PagarmeAddress;      // Customer address
  metadata?: Record<string, any>; // Custom data
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}

interface PagarmeAddress {
  street: string;          // Street name
  street_number: string;   // Street number
  neighborhood: string;    // Neighborhood
  city: string;           // City name
  state: string;          // Two-letter state code (SP, RJ, etc.)
  zipcode: string;        // CEP (8 digits, no formatting)
  country: string;        // Always "BR" for Brazil
  complement?: string;     // Apartment, suite, etc.
}
```

## Customer Creation

### **Create Customer API**

**Endpoint**: `POST https://api.pagar.me/core/v5/customers`

**Required Headers**:
```http
Authorization: Basic <base64(secret_key:)>
Content-Type: application/json
Accept: application/json
```

### **Request Body Validation**

```typescript
// EVIDENS Customer Creation Schema (from usePaymentMutations.tsx)
export const customerCreationSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  document: z.string().min(11, { message: 'Documento inválido' }),
  document_type: z.enum(['cpf', 'cnpj'], { message: 'Tipo de documento inválido' }),
  phone_numbers: z.array(z.string()).optional(),
  address: z.object({
    street: z.string().min(1, { message: 'Endereço é obrigatório' }),
    street_number: z.string().min(1, { message: 'Número é obrigatório' }),
    neighborhood: z.string().min(1, { message: 'Bairro é obrigatório' }),
    city: z.string().min(1, { message: 'Cidade é obrigatória' }),
    state: z.string().min(2, { message: 'Estado é obrigatório' }),
    zipcode: z.string().min(8, { message: 'CEP inválido' }),
    country: z.string().default('BR')
  }).optional()
});
```

### **EVIDENS Customer Creation Pattern**

```typescript
// Edge Function: create-pagarme-customer
import { authenticatePagarme } from '../_shared/auth-helpers.ts';

export default async function handler(req: Request) {
  const { user } = await validateAuth(req);
  
  const customerData = await req.json();
  const headers = authenticatePagarme(Deno.env.get('PAGARME_SECRET_KEY'));
  
  // Create customer in Pagar.me
  const response = await fetch('https://api.pagar.me/core/v5/customers', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: customerData.name,
      email: customerData.email,
      document: customerData.document.replace(/\D/g, ''), // Remove formatting
      document_type: customerData.document_type,
      type: customerData.document_type === 'cpf' ? 'individual' : 'company',
      phone_numbers: customerData.phone_numbers || [],
      address: customerData.address && {
        ...customerData.address,
        zipcode: customerData.address.zipcode.replace(/\D/g, '') // Remove CEP formatting
      },
      metadata: {
        evidens_user_id: user.id,
        created_via: 'evidens_platform'
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Customer creation failed: ${error.message}`);
  }

  const pagarmeCustomer = await response.json();
  
  // Store Pagar.me customer ID in EVIDENS user profile
  await supabase
    .from('users')
    .update({ pagarme_customer_id: pagarmeCustomer.id })
    .eq('id', user.id);

  return sendSuccess(pagarmeCustomer);
}
```

## Document Validation

### **CPF Validation**
- **Format**: 11 digits (numbers only, no formatting)
- **Validation**: Must pass CPF algorithm check
- **Example**: `12345678901` (after removing dots and dashes)

### **CNPJ Validation**  
- **Format**: 14 digits (numbers only, no formatting)
- **Validation**: Must pass CNPJ algorithm check
- **Example**: `12345678000195` (after removing dots, slashes, dashes)

### **Phone Number Format**
- **Format**: Brazilian format with country code
- **Examples**: 
  - `["+5511999999999"]` (Mobile with +55)
  - `["+5511888888888"]` (Landline with +55)
- **Storage**: Array of strings for multiple phone numbers

## Customer Retrieval

### **Get Customer API**

**Endpoint**: `GET https://api.pagar.me/core/v5/customers/{customer_id}`

```typescript
// Edge Function: get-pagarme-customer
export const getCustomerById = async (customerId: string) => {
  const headers = authenticatePagarme(Deno.env.get('PAGARME_SECRET_KEY'));
  
  const response = await fetch(`https://api.pagar.me/core/v5/customers/${customerId}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    if (response.status === 404) {
      return { customer: null, found: false };
    }
    throw new Error('Failed to fetch customer');
  }

  return { customer: await response.json(), found: true };
};
```

### **List Customers API**

**Endpoint**: `GET https://api.pagar.me/core/v5/customers`

**Query Parameters**:
- `page`: Page number (default: 1)
- `size`: Items per page (max: 100)  
- `name`: Filter by customer name
- `email`: Filter by customer email
- `document`: Filter by customer document

```typescript
// Customer listing with pagination
export const listCustomers = async (filters: {
  page?: number;
  size?: number;
  name?: string;
  email?: string;
  document?: string;
}) => {
  const headers = authenticatePagarme(Deno.env.get('PAGARME_SECRET_KEY'));
  const params = new URLSearchParams(filters as Record<string, string>);
  
  const response = await fetch(`https://api.pagar.me/core/v5/customers?${params}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error('Failed to list customers');
  }

  return response.json();
};
```

## Customer Updates

### **Update Customer API**

**Endpoint**: `PUT https://api.pagar.me/core/v5/customers/{customer_id}`

```typescript
// Customer profile update
export const updateCustomer = async (customerId: string, updateData: Partial<PagarmeCustomer>) => {
  const headers = authenticatePagarme(Deno.env.get('PAGARME_SECRET_KEY'));
  
  const response = await fetch(`https://api.pagar.me/core/v5/customers/${customerId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Customer update failed: ${error.message}`);
  }

  return response.json();
};
```

## EVIDENS Integration Patterns

### **Customer-User Synchronization**

```typescript
// Hook for managing customer-user relationship
export const useEvidensCustomerSync = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: { 
      userId: string; 
      customerData: CustomerCreationInput 
    }) => {
      // 1. Create customer in Pagar.me
      const pagarmeCustomer = await createPagarmeCustomer(userData.customerData);
      
      // 2. Link customer ID to EVIDENS user
      const { error } = await supabase
        .from('users')
        .update({ 
          pagarme_customer_id: pagarmeCustomer.id,
          payment_profile_complete: true 
        })
        .eq('id', userData.userId);
      
      if (error) throw error;
      
      return pagarmeCustomer;
    },
    onSuccess: () => {
      // Invalidate user queries to refresh payment status
      queryClient.invalidateQueries({ queryKey: ['user-status'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    }
  });
};
```

### **Customer Data Retrieval Pattern**

```typescript
// Hook to get customer data linked to EVIDENS user
export const useCustomerProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['customer-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // Get user with Pagar.me customer ID
      const { data: user } = await supabase
        .from('users')
        .select('pagarme_customer_id, name, email')
        .eq('id', userId)
        .single();
      
      if (!user?.pagarme_customer_id) {
        return { user, pagarmeCustomer: null, needsCustomerCreation: true };
      }
      
      // Fetch customer details from Pagar.me
      const response = await fetch(`/functions/v1/get-customer-profile?customerId=${user.pagarme_customer_id}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      const pagarmeCustomer = response.ok ? await response.json() : null;
      
      return { 
        user, 
        pagarmeCustomer, 
        needsCustomerCreation: false 
      };
    },
    enabled: Boolean(userId),
    staleTime: 300000, // Cache for 5 minutes
  });
};
```

## Business Rules & Validation

### **Email Uniqueness**
- **Rule**: Each email can only be associated with ONE customer in Pagar.me
- **Implication**: Check for existing customer before creation
- **EVIDENS Pattern**: Link EVIDENS user email to Pagar.me customer email

### **Document Validation Rules**
- **CPF**: Must be valid 11-digit CPF (individual customers)
- **CNPJ**: Must be valid 14-digit CNPJ (company customers)  
- **Uniqueness**: Each document can only be used once per customer
- **Format**: Store without formatting (numbers only)

### **Address Requirements**
- **Required for**: Credit card transactions, boleto generation
- **Optional for**: PIX payments
- **CEP Format**: 8 digits without formatting (`12345678`)
- **State Format**: Two-letter code (`SP`, `RJ`, `MG`)

### **Phone Number Guidelines**
- **Format**: Include country code `+55` for Brazil
- **Mobile**: `+5511999999999` (9 digits after area code)
- **Landline**: `+5511888888888` (8 digits after area code)
- **Storage**: Array format for multiple numbers

## Error Handling

### **Common Customer Creation Errors**

```typescript
// Customer error handling patterns
export const handleCustomerError = (error: any) => {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'customer_email_already_exists':
      return {
        field: 'email',
        message: 'Este email já está cadastrado. Use outro email ou faça login.',
        suggestion: 'redirect_to_login'
      };
    
    case 'invalid_document':
      return {
        field: 'document',
        message: 'CPF/CNPJ inválido. Verifique o número digitado.',
        suggestion: 'validate_document'
      };
    
    case 'invalid_zipcode':
      return {
        field: 'address.zipcode',
        message: 'CEP inválido. Use formato: 12345678',
        suggestion: 'format_zipcode'
      };
    
    default:
      return {
        field: 'general',
        message: 'Erro ao criar perfil de pagamento. Tente novamente.',
        suggestion: 'retry_operation'
      };
  }
};
```

### **Customer Validation Utilities**

```typescript
// Document validation helpers
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  
  // CPF validation algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  
  return remainder === parseInt(cleanCPF.charAt(10));
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return false;
  
  // CNPJ validation algorithm
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return digit2 === parseInt(cleanCNPJ.charAt(13));
};

export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add +55 if not present
  if (!cleanPhone.startsWith('55')) {
    return `+55${cleanPhone}`;
  }
  
  return `+${cleanPhone}`;
};
```

## Frontend Integration

### **Customer Creation Form Pattern**

```typescript
// Customer creation within payment flow
export const CustomerRegistrationForm = () => {
  const createCustomer = useCreatePagarmeCustomer();
  const { user } = useAuth();
  
  const form = useForm({
    resolver: zodResolver(customerCreationSchema),
    defaultValues: {
      name: user?.user_metadata?.full_name || '',
      email: user?.email || '',
      document: '',
      document_type: 'cpf' as const,
      address: {
        street: '',
        street_number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipcode: '',
        country: 'BR'
      }
    }
  });

  const onSubmit = (data: CustomerCreationInput) => {
    createCustomer.mutate(data, {
      onSuccess: (customer) => {
        toast.success('Perfil de pagamento criado com sucesso!');
        // Proceed to payment step
        onCustomerCreated(customer);
      },
      onError: (error) => {
        const handled = handleCustomerError(error);
        toast.error(handled.message);
        
        if (handled.field !== 'general') {
          form.setError(handled.field as any, { 
            message: handled.message 
          });
        }
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Customer form fields */}
      </form>
    </Form>
  );
};
```

### **Existing Customer Detection**

```typescript
// Check if user already has Pagar.me customer profile
export const useExistingCustomer = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['existing-customer', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('users')
        .select('pagarme_customer_id, name, email')
        .eq('id', user.id)
        .single();
      
      return data?.pagarme_customer_id || null;
    },
    enabled: Boolean(user?.id),
    staleTime: Infinity, // Customer ID doesn't change
  });
};
```

## Testing Strategies

### **Customer API Testing**

```typescript
// Test customer creation in development
export const testCustomerCreation = async () => {
  const testCustomer = {
    name: 'João Silva',
    email: `test.${Date.now()}@evidens.com.br`,
    document: '12345678901', // Valid test CPF
    document_type: 'cpf',
    phone_numbers: ['+5511999999999'],
    address: {
      street: 'Rua das Flores',
      street_number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01234567',
      country: 'BR'
    }
  };

  const response = await fetch('/functions/v1/create-pagarme-customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabase_session.access_token}`
    },
    body: JSON.stringify(testCustomer)
  });

  console.log('Customer creation test:', response.status === 200 ? 'PASS' : 'FAIL');
  return response.json();
};
```

## Advanced Patterns

### **Customer Address Management**

```typescript
// Address update pattern
export const useUpdateCustomerAddress = () => {
  return useMutation({
    mutationFn: async ({ customerId, address }: { 
      customerId: string; 
      address: PagarmeAddress 
    }) => {
      const headers = authenticatePagarme(Deno.env.get('PAGARME_SECRET_KEY'));
      
      const response = await fetch(`https://api.pagar.me/core/v5/customers/${customerId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        throw new Error('Failed to update customer address');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    }
  });
};
```

### **Customer Payment Methods**

```typescript
// Link customer to payment methods
export const useCustomerPaymentMethods = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-payment-methods', customerId],
    queryFn: async () => {
      const response = await fetch(`/functions/v1/get-customer-payment-methods?customerId=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      
      return response.json();
    },
    enabled: Boolean(customerId),
    staleTime: 60000, // Cache payment methods for 1 minute
  });
};
```

## Security Considerations

### **Customer Data Protection**
- **PII Security**: Never log customer documents or personal data
- **LGPD Compliance**: Implement data deletion and portability
- **Access Control**: Customers can only access their own data
- **Audit Trail**: Log customer data access and modifications

### **Customer-User Relationship Security**

```typescript
// Secure customer data access
export const getCustomerForUser = async (userId: string, customerId: string) => {
  // Verify customer belongs to user
  const { data: user } = await supabase
    .from('users')
    .select('pagarme_customer_id')
    .eq('id', userId)
    .single();
  
  if (user?.pagarme_customer_id !== customerId) {
    throw new Error('Unauthorized: Customer does not belong to user');
  }
  
  // Proceed with customer data fetching
  return getCustomerById(customerId);
};
```

## Best Practices

### **Customer Creation Workflow**
1. **Pre-Creation Check**: Verify email doesn't exist in Pagar.me
2. **Validation**: Validate all fields (CPF/CNPJ, phone, address)
3. **Creation**: Create customer in Pagar.me with metadata
4. **Linking**: Store Pagar.me customer ID in EVIDENS user profile
5. **Verification**: Confirm successful creation and linking

### **Customer Management**
- **Single Source**: Pagar.me customer data is authoritative
- **Sync Strategy**: Pull Pagar.me data, don't duplicate in EVIDENS
- **Cache Strategy**: Cache customer profile for 5 minutes
- **Update Strategy**: Update Pagar.me first, then invalidate cache

### **Performance Optimization**
- **Lazy Loading**: Only fetch customer when needed for payments
- **Bulk Operations**: Use list API for admin operations
- **Caching**: Leverage TanStack Query caching for frequent access
- **Pagination**: Always paginate customer lists (max 100 per page)

## Integration Checklist

- [ ] Customer creation Edge Function deployed
- [ ] Customer validation schemas implemented
- [ ] User-customer linking logic working
- [ ] Customer profile UI integrated
- [ ] Address validation functioning
- [ ] Document validation (CPF/CNPJ) working
- [ ] Error handling patterns implemented
- [ ] Customer data caching configured
- [ ] Customer security policies verified

---

**Next Steps**: 
1. [Order Management](./orders.md) - Learn order creation and management patterns
2. [Payment Processing](./charges.md) - Implement payment workflows
3. [PIX Integration](../payment-methods/pix.md) - Complete PIX implementation