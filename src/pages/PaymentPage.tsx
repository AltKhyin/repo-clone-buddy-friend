// ABOUTME: Secure payment page that fetches plan details from database using planId only
import React from 'react';
import TwoStepPaymentForm from '@/components/payment/TwoStepPaymentForm';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContactInfo } from '@/hooks/useContactInfo';
import { triggerPaymentSuccessWebhook } from '@/services/makeWebhookService';
import type { Database } from '@/integrations/supabase/types';

type PaymentPlan = Database['public']['Tables']['PaymentPlans']['Row'];

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { displayText: contactEmail, href: contactLink } = useContactInfo();
  
  // Extract plan slug from URL parameters (prettier URLs)
  const planSlug = searchParams.get('plan');
  
  // Fetch default plan setting separately for better cache management
  const { data: defaultPlanId } = useQuery({
    queryKey: ['default-payment-plan-id'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SiteSettings')
        .select('value')
        .eq('key', 'default_payment_plan_id')
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No default payment plan configured yet');
          return null;
        }
        throw new Error(`Failed to retrieve default plan settings: ${error.message}`);
      }
      
      if (!data?.value || data.value === '""' || data.value === '') {
        return null;
      }
      
      // Handle both JSON string and plain string formats
      try {
        return JSON.parse(data.value as string);
      } catch {
        return data.value as string;
      }
    },
    enabled: !planSlug, // Only fetch when no slug is provided
    staleTime: 10000, // Cache for 10 seconds
  });

  // Determine which plan ID to fetch (slug-based or default)
  const planIdentifier = planSlug || defaultPlanId;
  const searchMethod = planSlug ? 'slug' : 'id';

  // Fetch plan details with enhanced error handling and better cache management
  const { data: plan, isLoading, error, isError } = useQuery({
    queryKey: ['payment-plan', searchMethod, planIdentifier],
    queryFn: async () => {
      if (!planIdentifier) {
        throw new Error('No plan identifier available - no slug provided and no default plan configured');
      }

      try {
        let planQuery;
        let errorContext = '';
        
        if (planSlug) {
          // Look up plan by slug
          errorContext = `Plan slug "${planSlug}"`;
          planQuery = supabase
            .from('PaymentPlans')
            .select('*')
            .eq('slug', planSlug)
            .eq('is_active', true)
            .single();
        } else {
          // Look up plan by default plan ID
          errorContext = `Default plan ID "${defaultPlanId}"`;
          planQuery = supabase
            .from('PaymentPlans')
            .select('*')
            .eq('id', defaultPlanId)
            .eq('is_active', true)
            .single();
        }
        
        const { data, error: planError } = await planQuery;
        
        if (planError) {
          // Enhanced error messages based on error codes
          if (planError.code === 'PGRST116') {
            throw new Error(`${errorContext} not found or has been deactivated`);
          }
          throw new Error(`Database error while fetching plan: ${planError.message}`);
        }
        
        if (!data) {
          throw new Error(`${errorContext} returned no data - plan may be inactive`);
        }
        
        return data as PaymentPlan;
      } catch (err) {
        // Enhanced error logging for debugging
        console.error('PaymentPage plan fetch error:', {
          planSlug,
          defaultPlanId,
          planIdentifier,
          error: err,
          timestamp: new Date().toISOString()
        });
        throw err;
      }
    },
    enabled: Boolean(planIdentifier), // Only run when we have a plan identifier
    retry: (failureCount, error) => {
      // Only retry on network errors, not on business logic errors
      const shouldRetry = failureCount < 2 && 
        !error.message.includes('not found') &&
        !error.message.includes('configured') &&
        !error.message.includes('deactivated');
      
      if (shouldRetry) {
        console.log(`Retrying plan fetch (attempt ${failureCount + 1}/2)`);
      }
      
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
  });

  const handlePaymentSuccess = async (orderId: string, customerData?: any) => {
    // Update plan usage count with enhanced error handling
    if (plan?.id) {
      try {
        const { error: updateError } = await supabase
          .from('PaymentPlans')
          .update({ 
            usage_count: (plan.usage_count || 0) + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', plan.id);
          
        if (updateError) {
          // Log but don't block the success flow
          console.error('Failed to update plan usage statistics:', {
            planId: plan.id,
            planName: plan.name,
            error: updateError,
            orderId,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        // Non-blocking error - user payment was successful
        console.error('Unexpected error updating plan usage:', {
          planId: plan.id,
          error,
          orderId,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Note: Webhook integration is now handled by PaymentSuccessPage 
    // which creates accounts automatically and triggers webhooks with complete user data
    
    // Always navigate to success page regardless of usage update results
    try {
      // Build success URL with customer data for automatic account creation
      const successUrl = new URL('/pagamento-sucesso', window.location.origin);
      successUrl.searchParams.set('orderId', orderId);
      
      // Add customer data if provided (from TwoStepPaymentForm)
      if (customerData) {
        if (customerData.customerEmail) successUrl.searchParams.set('customerEmail', customerData.customerEmail);
        if (customerData.customerName) successUrl.searchParams.set('customerName', customerData.customerName);
        if (customerData.customerDocument) successUrl.searchParams.set('customerDocument', customerData.customerDocument);
        if (customerData.customerPhone) successUrl.searchParams.set('customerPhone', customerData.customerPhone);
        if (customerData.planId) successUrl.searchParams.set('planId', customerData.planId);
        if (customerData.amount) successUrl.searchParams.set('amount', customerData.amount.toString());
        if (customerData.paymentMethod) successUrl.searchParams.set('paymentMethod', customerData.paymentMethod);
      }
      
      navigate(successUrl.pathname + successUrl.search);
    } catch (navigationError) {
      // Fallback navigation in case of routing issues
      console.error('Navigation error after payment success:', navigationError);
      const fallbackUrl = customerData 
        ? `/pagamento-sucesso?orderId=${orderId}&customerEmail=${customerData.customerEmail || ''}&customerName=${customerData.customerName || ''}`
        : `/pagamento-sucesso?orderId=${orderId}`;
      window.location.href = fallbackUrl;
    }
  };

  const handlePaymentCancel = () => {
    // Navigate back to plans or home
    navigate('/');
  };

  // Note: We no longer need to check for planId since we support default plans

  if (isLoading) {
    return (
      <SplitScreenAuthLayout>
        <AuthFormContainer>
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h1 className="text-xl font-medium text-gray-900">Carregando plano...</h1>
            <p className="text-gray-600">Verificando detalhes do plano de pagamento.</p>
          </div>
        </AuthFormContainer>
      </SplitScreenAuthLayout>
    );
  }

  // Enhanced error handling with different UI for different error types
  if (error || !plan) {
    const getErrorDetails = () => {
      if (!error) return { type: 'generic', message: 'Plano não encontrado' };
      
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('not found') || errorMessage.includes('deactivated')) {
        return {
          type: 'not_found',
          title: 'Plano não disponível',
          message: planSlug 
            ? `O plano "${planSlug}" não foi encontrado ou foi desativado.`
            : 'O plano padrão não está mais disponível.',
          showFallback: !planSlug // Only show fallback for default plan issues
        };
      }
      
      if (errorMessage.includes('configured')) {
        return {
          type: 'configuration',
          title: 'Erro de configuração',
          message: 'Nenhum plano padrão foi configurado no sistema. Entre em contato com o suporte.',
          showFallback: false
        };
      }
      
      if (errorMessage.includes('database error') || errorMessage.includes('settings')) {
        return {
          type: 'database',
          title: 'Erro temporário',
          message: 'Houve um problema ao carregar o plano. Tente novamente em alguns instantes.',
          showFallback: true
        };
      }
      
      return {
        type: 'generic',
        title: 'Plano indisponível',
        message: 'O plano solicitado não está disponível no momento.',
        showFallback: true
      };
    };
    
    const errorDetails = getErrorDetails();
    
    return (
      <SplitScreenAuthLayout>
        <AuthFormContainer>
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">{errorDetails.title}</h1>
              <p className="text-gray-600 max-w-md mx-auto">
                {errorDetails.message}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
              >
                Voltar ao Início
              </button>
              
              {errorDetails.showFallback && (
                <button 
                  onClick={() => {
                    // Try to load default plan by removing slug parameter
                    navigate('/pagamento', { replace: true });
                    window.location.reload();
                  }}
                  className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Tentar Plano Padrão
                </button>
              )}
              
              {errorDetails.type === 'database' && (
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors"
                >
                  Tentar Novamente
                </button>
              )}
            </div>
            
            {(errorDetails.type === 'configuration' || errorDetails.type === 'database') && (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p>Problema persistente? Entre em contato conosco:</p>
                <a href={contactLink} className="font-medium text-blue-600 hover:underline">
                  {contactEmail}
                </a>
              </div>
            )}
          </div>
        </AuthFormContainer>
      </SplitScreenAuthLayout>
    );
  }

  // Render payment form with secure plan data
  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <TwoStepPaymentForm 
          plan={plan}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default PaymentPage;