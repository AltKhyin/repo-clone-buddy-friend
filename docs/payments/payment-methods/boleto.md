# Boleto Payment Implementation Guide

## Overview

Boleto bancário is Brazil's traditional bank slip payment method, offering broad accessibility for users without credit cards or digital payment preferences. This guide covers boleto generation, tracking, and integration with EVIDENS platform.

## Boleto Advantages

### **Business Benefits**
- **🎯 Traditional Users**: Reaches users without credit cards or PIX access
- **🏦 Universal Acceptance**: All Brazilian banks and ATMs accept boleto
- **📄 Physical Payment**: Can be printed and paid at bank branches
- **💰 No Chargeback Risk**: Lower fraud risk compared to credit cards
- **📈 Higher Average Order Value**: Users tend to pay full amounts upfront

### **Customer Benefits**
- **🔒 Security**: No card data or bank credentials required
- **⏰ Flexible Timing**: Can be paid until due date
- **📱 Multiple Channels**: Bank apps, ATMs, branches, lottery shops
- **📋 Payment Proof**: Official bank receipt for payment confirmation

## Boleto Object Structure (Official API)

### **Boleto Payment Configuration**

```typescript
// Official Pagar.me boleto structure from API collection
interface BoletoPaymentConfig {
  payment_method: 'boleto';
  boleto: {
    instructions: string;        // Payment instructions (max 255 chars)
    due_at: string;             // Due date (ISO format: "2030-02-20T00:00:00Z")
    type?: 'DM';                // Boleto type (usually "DM")
    document_number?: string;    // Custom document number
    
    // Optional: Interest and fines (Brazilian legal compliance)
    interest?: {
      days: number;             // Days after due date to apply interest
      type: 'percentage' | 'flat'; // Interest calculation type
      amount: number;           // Interest rate (max 1% per month by law)
    };
    
    fine?: {
      days: number;             // Days after due date to apply fine
      type: 'percentage' | 'flat'; // Fine calculation type  
      amount: number;           // Fine rate (max 2% by law)
    };
  };
}

// Boleto response structure
interface BoletoTransactionData {
  id: string;                   // Transaction ID
  transaction_type: 'boleto';   // Always "boleto"
  gateway_id: string;           // Gateway transaction ID
  amount: number;               // Amount in cents
  status: 'generated' | 'paid' | 'expired'; // Boleto status
  
  // Boleto-specific data
  url: string;                  // Boleto HTML page URL
  pdf: string;                  // Boleto PDF download URL
  line: string;                 // Linha digitável (numeric code for manual entry)
  barcode: string;              // Barcode image URL
  qr_code: string;              // PIX QR code for boleto (if enabled)
  nosso_numero: string;         // Bank internal number
  bank: string;                 // Bank code
  instructions: string;         // Payment instructions
  due_at: string;               // Due date
  
  created_at: string;           // Creation timestamp
  updated_at: string;           // Update timestamp
}
```

## Boleto Implementation

### **Boleto Payment Creation Edge Function**

```typescript
// Edge Function: create-boleto-payment
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticatePagarme, validateAuth, sendError, sendSuccess } from '../_shared/helpers.ts';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return sendError('Method not allowed', 405);
  }

  try {
    // 1. Authenticate EVIDENS user
    const { user } = await validateAuth(req);
    
    // 2. Validate payment data
    const paymentData = await req.json();
    const validation = boletoPaymentSchema.safeParse(paymentData);
    
    if (!validation.success) {
      return sendError('Invalid payment data', 400, validation.error.errors);
    }
    
    const { 
      customerId, 
      amount, 
      description, 
      dueDate,
      productId,
      metadata 
    } = validation.data;
    
    // 3. Calculate due date (default: 3 business days from now)
    const calculatedDueDate = dueDate || calculateBoletoeDueDate(3);
    
    // 4. Create boleto order using official API structure
    const headers = authenticatePagarme(Deno.env.get('PAGARME_SECRET_KEY')!);
    
    const orderPayload = {
      closed: true,
      customer_id: customerId,
      items: [
        {
          amount: amount,
          description: description,
          quantity: 1,
          code: productId || 'EVIDENS_SUBSCRIPTION'
        }
      ],
      payments: [
        {
          payment_method: 'boleto',
          boleto: {
            instructions: 'Sr. Caixa, favor não aceitar pagamento após o vencimento. EVIDENS - Assinatura Digital.',
            due_at: calculatedDueDate,
            
            // Apply legal-compliant interest and fine
            interest: {
              days: 1,              // Start interest 1 day after due date
              type: 'percentage',
              amount: 1             // 1% per month (legal maximum)
            },
            fine: {
              days: 1,              // Start fine 1 day after due date  
              type: 'percentage',
              amount: 2             // 2% fine (legal maximum)
            }
          }
        }
      ],
      metadata: {
        evidens_user_id: user.id,
        evidens_email: user.email,
        payment_flow: 'subscription_signup',
        due_date: calculatedDueDate,
        created_via: 'evidens_platform',
        ...metadata
      }
    };

    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Pagar.me boleto creation failed:', error);
      return sendError('Boleto creation failed', 400, error);
    }

    const order = await response.json();
    const charge = order.charges?.[0];
    const boletoData = charge?.last_transaction;
    
    if (!boletoData?.line) {
      return sendError('Boleto generation failed', 500);
    }

    // 5. Store payment transaction in EVIDENS
    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      pagarme_order_id: order.id,
      pagarme_charge_id: charge.id,
      amount: amount,
      payment_method: 'boleto',
      status: 'pending',
      due_date: calculatedDueDate,
      boleto_line: boletoData.line,
      boleto_url: boletoData.url,
      boleto_pdf: boletoData.pdf,
      nosso_numero: boletoData.nosso_numero,
      created_at: new Date().toISOString()
    });

    // 6. Return boleto data for UI
    return sendSuccess({
      orderId: order.id,
      chargeId: charge.id,
      amount: amount,
      status: charge.status,
      dueDate: calculatedDueDate,
      boletoData: {
        line: boletoData.line,           // Linha digitável
        url: boletoData.url,             // Boleto webpage
        pdf: boletoData.pdf,             // PDF download
        barcode: boletoData.barcode,     // Barcode image
        qrCode: boletoData.qr_code,      // PIX QR for boleto
        nossoNumero: boletoData.nosso_numero,
        bank: boletoData.bank,
        instructions: boletoData.instructions
      },
      created: true
    });
    
  } catch (error) {
    console.error('Boleto payment creation error:', error);
    return sendError('Internal server error', 500);
  }
}

// Calculate boleto due date (business days)
const calculateBoletoeDueDate = (businessDays: number): string => {
  const date = new Date();
  let addedDays = 0;
  
  while (addedDays < businessDays) {
    date.setDate(date.getDate() + 1);
    
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      addedDays++;
    }
  }
  
  // Set to end of day
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};
```

### **Boleto Validation Schema**

```typescript
// Boleto payment validation schema
export const boletoPaymentSchema = z.object({
  customerId: z.string().min(1, { message: 'Customer ID é obrigatório' }),
  amount: z.number().min(100, { message: 'Valor mínimo é R$ 1,00' }),
  description: z.string().min(1, { message: 'Descrição é obrigatória' }),
  dueDate: z.string().optional(), // ISO date string
  productId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  
  // Boleto-specific options
  customInstructions: z.string().max(255).optional(),
  documentNumber: z.string().optional(),
  applyInterest: z.boolean().default(true),
  applyFine: z.boolean().default(true)
});

export type BoletoPaymentInput = z.infer<typeof boletoPaymentSchema>;
```

## Boleto Frontend Implementation

### **Boleto Payment Form**

```typescript
// Boleto payment selection and configuration
export const BoletoPaymentForm = ({ 
  planId, 
  customerId, 
  onBoletoCreated 
}: {
  planId: string;
  customerId: string;
  onBoletoCreated: (boletoData: any) => void;
}) => {
  const [dueDate, setDueDate] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  
  const createBoletoPayment = useCreateBoletoPayment();
  const planDetails = getSubscriptionPlan(planId);
  
  // Calculate default due date options
  const dueDateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    
    for (let days of [3, 7, 15, 30]) {
      const date = new Date(today);
      
      // Add business days
      let addedDays = 0;
      while (addedDays < days) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          addedDays++;
        }
      }
      
      options.push({
        value: date.toISOString().split('T')[0],
        label: `${days} dias úteis (${date.toLocaleDateString('pt-BR')})`,
        days: days,
        businessDays: addedDays
      });
    }
    
    return options;
  }, []);
  
  // Set default due date (7 business days)
  useEffect(() => {
    if (!dueDate && dueDateOptions.length > 0) {
      setDueDate(dueDateOptions[1]?.value || ''); // 7 days default
    }
  }, [dueDate, dueDateOptions]);
  
  const handleCreateBoleto = async () => {
    if (!dueDate) {
      toast.error('Selecione a data de vencimento');
      return;
    }
    
    try {
      setIsCreating(true);
      
      const result = await createBoletoPayment.mutateAsync({
        customerId,
        amount: planDetails.price * 100, // Convert to cents
        description: `EVIDENS - ${planDetails.name}`,
        dueDate: `${dueDate}T23:59:59Z`, // End of day
        productId: planId,
        applyInterest: true,
        applyFine: true
      });
      
      onBoletoCreated(result);
      
    } catch (error) {
      console.error('Boleto creation failed:', error);
      toast.error('Erro ao gerar boleto. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Boleto Bancário</h3>
        <p className="text-gray-600 mb-6">
          Pague em qualquer banco, ATM ou lotérica
        </p>
        
        {/* Due Date Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-left">
            Data de Vencimento
          </label>
          <Select value={dueDate} onValueChange={setDueDate}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o vencimento" />
            </SelectTrigger>
            <SelectContent>
              {dueDateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Boleto Information */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Info className="w-5 h-5" />
            <span className="font-medium">Como funciona:</span>
          </div>
          <ul className="text-sm text-blue-700 text-left space-y-1">
            <li>• Boleto será gerado instantaneamente</li>
            <li>• Pague em qualquer banco ou app bancário</li>
            <li>• Confirmação em até 3 dias úteis</li>
            <li>• Acesso liberado após confirmação do pagamento</li>
            <li>• {dueDate && `Vencimento: ${new Date(dueDate).toLocaleDateString('pt-BR')}`}</li>
          </ul>
        </div>
        
        <Button
          onClick={handleCreateBoleto}
          disabled={isCreating || !dueDate}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isCreating ? 'Gerando Boleto...' : `Gerar Boleto - R$ ${planDetails.price.toFixed(2)}`}
        </Button>
      </div>
    </Card>
  );
};
```

### **Boleto Display Component**

```typescript
// Boleto display with download and payment options
export const BoletoDisplay = ({ 
  boletoData,
  onPaymentConfirmed
}: {
  boletoData: {
    line: string;
    url: string;
    pdf: string;
    barcode: string;
    qrCode?: string;
    dueDate: string;
    amount: number;
    nossoNumero: string;
    instructions: string;
  };
  onPaymentConfirmed: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const daysUntilDue = useMemo(() => {
    const due = new Date(boletoData.dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [boletoData.dueDate]);
  
  const copyBoletoLine = async () => {
    try {
      await navigator.clipboard.writeText(boletoData.line);
      setCopied(true);
      toast.success('Linha digitável copiada!');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Erro ao copiar. Tente selecionando o texto.');
    }
  };
  
  return (
    <Card className="p-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <FileText className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Boleto Gerado</h3>
        </div>
        
        {/* Due Date Warning */}
        <div className={`p-3 rounded-lg mb-4 ${
          daysUntilDue <= 1 
            ? 'bg-red-50 border border-red-200' 
            : daysUntilDue <= 3 
            ? 'bg-orange-50 border border-orange-200' 
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Calendar className={`w-4 h-4 ${
              daysUntilDue <= 1 ? 'text-red-600' : daysUntilDue <= 3 ? 'text-orange-600' : 'text-blue-600'
            }`} />
            <span className={`font-medium ${
              daysUntilDue <= 1 ? 'text-red-800' : daysUntilDue <= 3 ? 'text-orange-800' : 'text-blue-800'
            }`}>
              Vence em {daysUntilDue} dia{daysUntilDue !== 1 ? 's' : ''}
            </span>
          </div>
          <p className={`text-sm ${
            daysUntilDue <= 1 ? 'text-red-700' : daysUntilDue <= 3 ? 'text-orange-700' : 'text-blue-700'
          }`}>
            {new Date(boletoData.dueDate).toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Payment Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          
          {/* Download PDF */}
          <a
            href={boletoData.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium">Baixar Boleto</p>
              <p className="text-sm text-gray-600">PDF para imprimir</p>
            </div>
          </a>
          
          {/* Open in Browser */}
          <a
            href={boletoData.url}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium">Abrir Boleto</p>
              <p className="text-sm text-gray-600">Visualizar no navegador</p>
            </div>
          </a>
        </div>
        
        {/* Linha Digitável */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Linha Digitável (para digitação no banco):
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={formatBoletoLine(boletoData.line)}
              readOnly
              className="text-xs bg-white font-mono text-center"
            />
            <Button
              size="sm"
              onClick={copyBoletoLine}
              variant={copied ? "default" : "outline"}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* PIX QR Code for Boleto (if available) */}
        {boletoData.qrCode && (
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <QrCode className="w-5 h-5" />
              <span className="font-medium">Ou pague com PIX:</span>
            </div>
            <img 
              src={boletoData.qrCode}
              alt="QR Code PIX do Boleto"
              className="w-32 h-32 mx-auto border rounded"
            />
            <p className="text-xs text-green-700 mt-2">
              Escaneie com seu banco para pagamento instantâneo
            </p>
          </div>
        )}
        
        {/* Payment Instructions */}
        <div className="text-sm text-gray-600 mb-4">
          <h4 className="font-medium mb-2">Onde pagar:</h4>
          <ul className="text-left space-y-1">
            <li>• Qualquer banco (agência ou internet banking)</li>
            <li>• ATMs Banco do Brasil, Caixa, Bradesco</li>
            <li>• Aplicativos dos bancos</li>
            <li>• Casas lotéricas</li>
            <li>• Supermercados credenciados</li>
          </ul>
        </div>
        
        <Button
          onClick={() => window.location.href = '/dashboard'}
          variant="outline"
          className="w-full"
        >
          Voltar ao Dashboard
        </Button>
      </div>
    </Card>
  );
};

// Format boleto line for better readability
const formatBoletoLine = (line: string): string => {
  // Standard boleto line format: XXXXX.XXXXX XXXXX.XXXXXX XXXXX.XXXXXX X XXXXXXXXXXXXXXXX
  return line.replace(/(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{14})/, 
    '$1.$2 $3.$4 $5.$6 $7 $8');
};
```

## Boleto Status Management

### **Boleto Payment Tracking**

```typescript
// Boleto payment status tracking with longer polling intervals
export const useBoletoPaymentTracking = (orderId?: string) => {
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const query = useQuery({
    queryKey: ['boleto-payment-status', orderId],
    queryFn: async () => {
      const response = await fetch(`/functions/v1/check-payment-status?orderId=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check boleto payment status');
      }
      
      const order = await response.json();
      const charge = order.charges?.[0];
      
      // Handle payment confirmation
      if (charge?.status === 'paid' && !paymentConfirmed) {
        setPaymentConfirmed(true);
        
        // Track boleto payment success
        analyticsTrack('boleto_payment_confirmed', {
          orderId,
          chargeId: charge.id,
          amount: charge.amount,
          daysToPayment: Math.floor(
            (new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )
        });
      }
      
      return {
        order,
        charge,
        status: charge?.status || 'unknown',
        
        // Boleto specific data
        boletoData: charge?.last_transaction ? {
          line: charge.last_transaction.line,
          url: charge.last_transaction.url,
          pdf: charge.last_transaction.pdf,
          barcode: charge.last_transaction.barcode,
          qrCode: charge.last_transaction.qr_code,
          dueDate: charge.last_transaction.due_at,
          nossoNumero: charge.last_transaction.nosso_numero,
          bank: charge.last_transaction.bank
        } : null,
        
        // Status helpers
        isPending: charge?.status === 'pending',
        isPaid: charge?.status === 'paid',
        isExpired: charge?.last_transaction?.due_at && 
                   new Date(charge.last_transaction.due_at) < new Date(),
        
        // Days calculation
        daysUntilDue: charge?.last_transaction?.due_at ? 
          Math.ceil((new Date(charge.last_transaction.due_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0,
        
        // UI helpers
        shouldShowBoleto: charge?.status === 'pending',
        shouldShowSuccess: charge?.status === 'paid',
        shouldShowExpired: charge?.last_transaction?.due_at && 
                          new Date(charge.last_transaction.due_at) < new Date()
      };
    },
    enabled: Boolean(orderId),
    refetchInterval: (data) => {
      // Longer polling intervals for boleto (confirmation takes 1-3 days)
      if (!data) return 30000; // 30 seconds
      
      const finalStates = ['paid', 'failed', 'canceled'];
      const isExpired = data.boletoData?.dueDate && new Date(data.boletoData.dueDate) < new Date();
      
      return (finalStates.includes(data.status) || isExpired) 
        ? false          // Stop polling
        : 300000;        // 5 minutes for pending boletos
    },
    refetchIntervalInBackground: false,
    staleTime: 60000 // Cache for 1 minute
  });
  
  return {
    ...query,
    paymentConfirmed
  };
};
```

## Boleto Business Logic

### **Due Date Calculation**

```typescript
// Brazilian business day calculation for boleto due dates
export const boletoDateCalculator = {
  
  // Calculate business days excluding weekends and holidays
  addBusinessDays: (startDate: Date, businessDays: number): Date => {
    const result = new Date(startDate);
    let addedDays = 0;
    
    // Brazilian national holidays (major ones)
    const holidays = getBrazilianHolidays(result.getFullYear());
    
    while (addedDays < businessDays) {
      result.setDate(result.getDate() + 1);
      
      // Skip weekends
      if (result.getDay() === 0 || result.getDay() === 6) {
        continue;
      }
      
      // Skip national holidays
      const dateString = result.toISOString().split('T')[0];
      if (holidays.includes(dateString)) {
        continue;
      }
      
      addedDays++;
    }
    
    return result;
  },
  
  // Get recommended due date options for EVIDENS
  getRecommendedDueDates: () => {
    const now = new Date();
    
    return [
      {
        days: 3,
        date: boletoDateCalculator.addBusinessDays(now, 3),
        recommended: false,
        reason: 'Rápido mas pode pressionar usuário'
      },
      {
        days: 7,
        date: boletoDateCalculator.addBusinessDays(now, 7),
        recommended: true,
        reason: 'Equilíbrio ideal entre conversão e conveniência'
      },
      {
        days: 15,
        date: boletoDateCalculator.addBusinessDays(now, 15),
        recommended: false,
        reason: 'Confortável mas reduz urgência'
      },
      {
        days: 30,
        date: boletoDateCalculator.addBusinessDays(now, 30),
        recommended: false,
        reason: 'Muito longo, alta taxa de abandono'
      }
    ];
  }
};

// Brazilian national holidays (simplified - add more as needed)
const getBrazilianHolidays = (year: number): string[] => {
  return [
    `${year}-01-01`, // New Year
    `${year}-04-21`, // Tiradentes  
    `${year}-09-07`, // Independence Day
    `${year}-10-12`, // Our Lady of Aparecida
    `${year}-11-02`, // All Souls' Day
    `${year}-11-15`, // Proclamation of the Republic
    `${year}-12-25`, // Christmas
  ];
};
```

### **Boleto Conversion Optimization**

```typescript
// Boleto-specific conversion optimization
export const useBoletoConversionOptimization = () => {
  
  const optimizeDueDate = (userProfile: {
    paymentHistory?: any[];
    registrationDate?: string;
    riskScore?: number;
  }) => {
    // New users: shorter due date for urgency
    if (!userProfile.paymentHistory?.length) {
      return 7; // 7 days for new users
    }
    
    // Established users: longer due date for convenience
    if (userProfile.paymentHistory.length > 3) {
      return 15; // 15 days for established users
    }
    
    return 10; // Default middle ground
  };
  
  const shouldOfferBoleto = (context: {
    userAgent: string;
    paymentAttempts?: number;
    preferredMethod?: string;
  }) => {
    // Don't offer boleto as primary on mobile
    const isMobile = /Mobi|Android/i.test(context.userAgent);
    if (isMobile && !context.paymentAttempts) {
      return { offer: false, reason: 'mobile_first_time' };
    }
    
    // Offer boleto after failed card attempts
    if (context.paymentAttempts && context.paymentAttempts > 1) {
      return { offer: true, reason: 'fallback_after_failures' };
    }
    
    // Offer boleto if explicitly preferred
    if (context.preferredMethod === 'boleto') {
      return { offer: true, reason: 'user_preference' };
    }
    
    return { offer: true, reason: 'standard_option' };
  };
  
  return {
    optimizeDueDate,
    shouldOfferBoleto
  };
};
```

## Boleto Analytics

### **Boleto Performance Metrics**

```typescript
// Boleto-specific analytics and insights
export const useBoletoAnalytics = (timeframe: 'week' | 'month' | 'quarter' = 'month') => {
  return useQuery({
    queryKey: ['boleto-analytics', timeframe],
    queryFn: async () => {
      const response = await fetch(`/functions/v1/boleto-analytics?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch boleto analytics');
      }
      
      const data = await response.json();
      
      return {
        ...data,
        
        // Computed boleto metrics
        boletoConversionRate: data.boletoGenerated > 0 ? (data.boletoPaid / data.boletoGenerated) * 100 : 0,
        averagePaymentDelay: data.boletoPaid > 0 ? data.totalPaymentDays / data.boletoPaid : 0,
        expirationRate: data.boletoGenerated > 0 ? (data.boletoExpired / data.boletoGenerated) * 100 : 0,
        
        // Due date analysis
        optimalDueDays: data.dueDateAnalysis?.find((d: any) => 
          d.conversionRate === Math.max(...data.dueDateAnalysis.map((x: any) => x.conversionRate))
        )?.days || 7,
        
        // Payment timing insights
        paymentDistribution: data.paymentsByDay, // Which days of week people pay most
        latePaymentRate: data.boletoPaid > 0 ? (data.latePayments / data.boletoPaid) * 100 : 0,
        
        // Business insights
        boletoRevenueShare: data.totalRevenue > 0 ? (data.boletoRevenue / data.totalRevenue) * 100 : 0,
        averageBoletoValue: data.boletoPaid > 0 ? data.boletoRevenue / data.boletoPaid : 0
      };
    },
    staleTime: 600000, // Cache for 10 minutes (boleto changes slowly)
  });
};
```

## Boleto Testing

### **Boleto Testing Utilities**

```typescript
// Test boleto generation and workflow
export const testBoletoFlow = async () => {
  console.log('Testing boleto payment flow...');
  
  try {
    // 1. Create test customer
    const testCustomer = await createPagarmeCustomer({
      name: 'João Silva Boleto Test',
      email: `boleto.test.${Date.now()}@evidens.com.br`,
      document: '12345678901',
      document_type: 'cpf',
      address: {
        line_1: 'Rua das Flores, 123',
        line_2: 'Apto 45',
        zip_code: '01234567',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR'
      }
    });
    
    console.log('✓ Test customer created:', testCustomer.id);
    
    // 2. Create boleto payment
    const boletoPayment = await createBoletoPayment({
      customerId: testCustomer.id,
      amount: 2990, // R$ 29.90
      description: 'EVIDENS - Teste Boleto',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      applyInterest: true,
      applyFine: true
    });
    
    console.log('✓ Boleto payment created:', boletoPayment.orderId);
    console.log('✓ Linha digitável generated:', Boolean(boletoPayment.boletoData?.line));
    console.log('✓ PDF URL available:', Boolean(boletoPayment.boletoData?.pdf));
    console.log('✓ Due date set:', boletoPayment.dueDate);
    
    // 3. Validate boleto data
    const validations = {
      lineFormat: /^\d{47,48}$/.test(boletoPayment.boletoData.line.replace(/\D/g, '')),
      pdfAccessible: Boolean(boletoPayment.boletoData.pdf),
      validDueDate: new Date(boletoPayment.dueDate) > new Date(),
      hasNossoNumero: Boolean(boletoPayment.boletoData.nossoNumero)
    };
    
    console.log('Validations:', validations);
    
    // 4. Test status tracking (short simulation)
    const statusResponse = await fetch(`/functions/v1/check-payment-status?orderId=${boletoPayment.orderId}`);
    const orderStatus = await statusResponse.json();
    
    console.log('✓ Status tracking working:', orderStatus.charges?.[0]?.status);
    
    return {
      success: Object.values(validations).every(Boolean),
      testCustomerId: testCustomer.id,
      orderId: boletoPayment.orderId,
      boletoData: boletoPayment.boletoData,
      validations,
      initialStatus: orderStatus.charges?.[0]?.status
    };
    
  } catch (error) {
    console.error('✗ Boleto payment flow test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

## Boleto Notifications

### **Boleto Payment Reminders**

```typescript
// Automated boleto payment reminders
export const boletoReminderSystem = {
  
  // Schedule payment reminders
  scheduleReminders: async (
    orderId: string,
    userId: string,
    dueDate: string,
    userEmail: string
  ) => {
    const due = new Date(dueDate);
    const now = new Date();
    
    // Schedule reminder emails
    const reminders = [
      {
        type: 'generated',
        scheduledFor: now, // Immediate
        message: 'Boleto gerado com sucesso'
      },
      {
        type: 'reminder_3_days',
        scheduledFor: new Date(due.getTime() - 3 * 24 * 60 * 60 * 1000),
        message: 'Seu boleto vence em 3 dias'
      },
      {
        type: 'reminder_1_day',
        scheduledFor: new Date(due.getTime() - 1 * 24 * 60 * 60 * 1000),
        message: 'Seu boleto vence amanhã'
      },
      {
        type: 'due_today',
        scheduledFor: new Date(due.getTime() - 6 * 60 * 60 * 1000), // 6 hours before
        message: 'Último dia para pagamento do boleto'
      }
    ];
    
    // Store reminder schedule
    for (const reminder of reminders) {
      if (reminder.scheduledFor > now) {
        await fetch('/functions/v1/schedule-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            orderId,
            email: userEmail,
            type: reminder.type,
            scheduledFor: reminder.scheduledFor.toISOString(),
            subject: reminder.message,
            template: 'boleto_reminder'
          })
        });
      }
    }
  },
  
  // Handle payment confirmation notification
  handleBoletoConfirmation: async (orderId: string, userId: string) => {
    // Cancel pending reminders
    await fetch('/functions/v1/cancel-scheduled-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        type: 'boleto_reminder'
      })
    });
    
    // Send payment confirmation
    await fetch('/functions/v1/send-payment-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        orderId,
        paymentMethod: 'boleto',
        template: 'boleto_confirmation'
      })
    });
  }
};
```

## Advanced Boleto Features

### **Boleto Reconciliation**

```typescript
// Boleto payment reconciliation system
export const useBoletoReconciliation = () => {
  
  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      // Get latest boleto status from Pagar.me
      const response = await fetch(`/functions/v1/reconcile-boleto?orderId=${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Boleto reconciliation failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      if (result.statusChanged) {
        toast.success('Status do boleto atualizado');
        queryClient.invalidateQueries({ queryKey: ['boleto-payment-status'] });
        queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      }
    }
  });
};
```

### **Boleto Renewal for Expired Boletos**

```typescript
// Handle expired boleto renewal
export const useBoletoRenewal = () => {
  
  return useMutation({
    mutationFn: async ({ 
      originalOrderId, 
      newDueDate 
    }: { 
      originalOrderId: string; 
      newDueDate: string;
    }) => {
      // Create new boleto with extended due date
      const response = await fetch('/functions/v1/renew-boleto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          originalOrderId,
          newDueDate,
          reason: 'customer_requested_renewal'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Boleto renewal failed');
      }
      
      return response.json();
    },
    onSuccess: (newBoleto) => {
      toast.success('Novo boleto gerado com prazo estendido');
      
      // Track renewal
      analyticsTrack('boleto_renewed', {
        originalOrderId: newBoleto.originalOrderId,
        newOrderId: newBoleto.orderId,
        extensionDays: newBoleto.extensionDays
      });
    },
    onError: (error) => {
      console.error('Boleto renewal failed:', error);
      toast.error('Erro ao gerar novo boleto.');
    }
  });
};
```

## Boleto Legal Compliance

### **Interest and Fine Configuration (Brazilian Law)**

```typescript
// Brazilian legal limits for boleto interest and fines
export const boletoLegalConfig = {
  
  // Legal maximum interest rate (1% per month)
  maxInterestPerMonth: 1.0,
  
  // Legal maximum fine rate (2% of principal)
  maxFinePercentage: 2.0,
  
  // Create legally compliant interest configuration
  createInterestConfig: (daysAfterDue: number = 1): NonNullable<BoletoPaymentConfig['boleto']['interest']> => {
    return {
      days: daysAfterDue,
      type: 'percentage',
      amount: 1.0 // 1% per month (legal maximum)
    };
  },
  
  // Create legally compliant fine configuration
  createFineConfig: (daysAfterDue: number = 1): NonNullable<BoletoPaymentConfig['boleto']['fine']> => {
    return {
      days: daysAfterDue,
      type: 'percentage', 
      amount: 2.0 // 2% fine (legal maximum)
    };
  },
  
  // Validate boleto configuration for legal compliance
  validateLegalCompliance: (config: BoletoPaymentConfig['boleto']) => {
    const violations: string[] = [];
    
    if (config.interest && config.interest.amount > 1.0) {
      violations.push('Interest rate exceeds 1% monthly legal maximum');
    }
    
    if (config.fine && config.fine.amount > 2.0) {
      violations.push('Fine rate exceeds 2% legal maximum');
    }
    
    // Due date should be reasonable (max 60 days)
    if (config.due_at) {
      const dueDate = new Date(config.due_at);
      const maxDue = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
      
      if (dueDate > maxDue) {
        violations.push('Due date exceeds reasonable 60-day maximum');
      }
    }
    
    return {
      compliant: violations.length === 0,
      violations
    };
  }
};
```

## Boleto User Experience

### **Boleto Payment Instructions Component**

```typescript
// Comprehensive boleto payment instructions
export const BoletoInstructions = ({ 
  boletoData,
  showDetailed = false
}: {
  boletoData: any;
  showDetailed?: boolean;
}) => {
  const [showAll, setShowAll] = useState(showDetailed);
  
  const basicInstructions = [
    {
      icon: Download,
      title: 'Baixe o boleto',
      description: 'Clique em "Baixar Boleto" ou acesse o link enviado por email'
    },
    {
      icon: Building,
      title: 'Pague no banco',
      description: 'Leve o boleto ao banco, ATM ou use o internet banking'
    },
    {
      icon: Clock,
      title: 'Aguarde confirmação',
      description: 'O pagamento será confirmado em até 3 dias úteis'
    }
  ];
  
  const detailedOptions = [
    {
      category: 'Bancos Físicos',
      options: [
        'Qualquer agência bancária (Banco do Brasil, Caixa, Bradesco, Itaú, Santander)',
        'ATMs de bancos principais',
        'Postos de autoatendimento'
      ]
    },
    {
      category: 'Internet Banking',
      options: [
        'Site do seu banco',
        'Aplicativo do banco no celular',
        'PIX através do QR code do boleto (se disponível)'
      ]
    },
    {
      category: 'Outros Locais',
      options: [
        'Casas lotéricas (até R$ 800,00)',
        'Correspondentes bancários',
        'Alguns supermercados e farmácias'
      ]
    }
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Como pagar seu boleto</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Menos detalhes' : 'Mais opções'}
        </Button>
      </div>
      
      {/* Basic Instructions */}
      <div className="space-y-3 mb-4">
        {basicInstructions.map((instruction, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <instruction.icon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">{instruction.title}</p>
              <p className="text-xs text-gray-600">{instruction.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Detailed Payment Options */}
      {showAll && (
        <div className="border-t pt-4">
          <h5 className="font-medium mb-3 text-sm">Locais para pagamento:</h5>
          <div className="space-y-3">
            {detailedOptions.map((category, index) => (
              <div key={index}>
                <h6 className="font-medium text-xs text-gray-700 mb-2">
                  {category.category}:
                </h6>
                <ul className="text-xs text-gray-600 space-y-1 ml-2">
                  {category.options.map((option, optIndex) => (
                    <li key={optIndex}>• {option}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Important Notes */}
      <div className="bg-yellow-50 p-3 rounded-lg mt-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-yellow-800 mb-1">Importante:</p>
            <ul className="text-yellow-700 space-y-0.5">
              <li>• Pagamentos após o vencimento estão sujeitos a juros e multa</li>
              <li>• Boletos expirados não podem ser pagos</li>
              <li>• A confirmação pode levar até 3 dias úteis</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
```

## Integration Checklist

### **Boleto Technical Setup**
- [ ] Boleto payment Edge Function deployed (`create-boleto-payment`)
- [ ] Boleto line generation working correctly
- [ ] Boleto PDF generation and download functional
- [ ] Due date calculation with business day logic implemented
- [ ] Interest and fine configuration legally compliant

### **Boleto User Experience**
- [ ] Boleto display component with download options
- [ ] Linha digitável copy functionality working
- [ ] Payment instructions comprehensive and clear
- [ ] Due date warnings and countdown implemented
- [ ] Expired boleto renewal flow functional

### **Boleto Business Features**  
- [ ] Boleto analytics tracking (conversion, expiration rates)
- [ ] Payment reminder system configured
- [ ] Boleto payment confirmation emails working
- [ ] Due date optimization logic implemented
- [ ] Boleto vs other payment method comparison available

### **Legal & Compliance**
- [ ] Interest rate capped at 1% monthly (legal maximum)
- [ ] Fine rate capped at 2% of principal (legal maximum)
- [ ] Payment instructions legally compliant
- [ ] Brazilian holiday calendar integrated for due date calculation
- [ ] Legal disclaimer text included in boleto instructions

---

**Boleto Summary**: Boleto provides broad accessibility for traditional Brazilian users and those without digital payment methods. Implementation focuses on legal compliance, comprehensive payment instructions, and effective reminder systems while maintaining 1-3 day payment confirmation workflows.

**Next Steps**: 
1. [Payment Method Comparison](./comparison-guide.md) - Decision matrix for optimal payment method selection
2. [Subscription Integration](../subscriptions/plans.md) - Connect boleto to recurring billing
3. [Edge Function Templates](../edge-functions/boleto-payment.md) - Complete boleto processing code