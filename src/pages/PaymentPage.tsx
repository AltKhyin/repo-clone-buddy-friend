// ABOUTME: Secure payment page that fetches plan details from database using planId only
import React from 'react';
import TwoStepPaymentForm from '@/components/payment/TwoStepPaymentForm';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PaymentPlan = Database['public']['Tables']['PaymentPlans']['Row'];

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract plan slug from URL parameters (prettier URLs)
  const planSlug = searchParams.get('plan');
  
  // Fetch plan details from database using slug or default plan
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['payment-plan', planSlug],
    queryFn: async () => {
      let planQuery;
      
      if (planSlug) {
        // Look up plan by slug
        planQuery = supabase
          .from('PaymentPlans')
          .select('*')
          .eq('slug', planSlug)
          .eq('is_active', true) // Only allow active plans
          .single();
      } else {
        // No slug provided, get default plan
        const { data: defaultSetting } = await supabase
          .from('SiteSettings')
          .select('value')
          .eq('key', 'default_payment_plan_id')
          .single();
          
        // Handle both JSON string and plain string formats
        let defaultPlanId = null;
        if (defaultSetting?.value) {
          try {
            // Try parsing as JSON first (new format)
            defaultPlanId = JSON.parse(defaultSetting.value as string);
          } catch {
            // Fallback to plain string (current format)
            defaultPlanId = defaultSetting.value as string;
          }
        }
        
        if (!defaultPlanId) {
          throw new Error('No default payment plan configured');
        }
        
        planQuery = supabase
          .from('PaymentPlans')
          .select('*')
          .eq('id', defaultPlanId)
          .eq('is_active', true)
          .single();
      }
      
      const { data, error } = await planQuery;
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Plan not found or inactive');
      }
      
      return data as PaymentPlan;
    },
    retry: false // Don't retry failed requests for security
  });

  const handlePaymentSuccess = async (orderId: string) => {
    // Update plan usage count
    if (plan?.id) {
      try {
        await supabase
          .from('PaymentPlans')
          .update({ 
            usage_count: (plan.usage_count || 0) + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', plan.id);
      } catch (error) {
        console.error('Failed to update plan usage:', error);
      }
    }
    
    // Navigate to success page or dashboard
    navigate(`/pagamento-sucesso?orderId=${orderId}`);
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

  if (error || !plan) {
    return (
      <SplitScreenAuthLayout>
        <AuthFormContainer>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Esta oferta não está mais disponível</h1>
            <p className="text-gray-600">
              O plano solicitado não existe, foi desativado ou expirou. Entre em contato com o suporte para mais informações.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Voltar ao Início
            </button>
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
          planName={plan.name}
          planPrice={plan.amount} // Already in cents from database
          planDescription={plan.description || `${plan.days} dias de acesso premium`}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default PaymentPage;