// ABOUTME: Simple profile completion form for essential data to prevent users from getting lost

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useJourneyOrchestration } from '@/hooks/useJourneyOrchestration';
import { User, CheckCircle } from 'lucide-react';

// Simple validation schema for essential fields only
const profileCompletionSchema = z.object({
  full_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  profession: z.string()
    .min(1, 'Selecione sua profissão'),
});

// Common healthcare professions in Brazil
const PROFESSIONS = [
  'Médico',
  'Enfermeiro',
  'Dentista',
  'Fisioterapeuta',
  'Psicólogo',
  'Farmacêutico',
  'Nutricionista',
  'Veterinário',
  'Biomédico',
  'Fonoaudiólogo',
  'Terapeuta Ocupacional',
  'Educador Físico',
  'Outro'
] as const;

const ProfileCompletionForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, practitioner } = useAuthStore();
  const { preservedPaymentData, journeyParams } = useJourneyOrchestration();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileCompletionSchema>>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      full_name: practitioner?.full_name || '',
      profession: practitioner?.profession || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof profileCompletionSchema>) => {
    if (!user || !practitioner) return;

    setIsSubmitting(true);
    
    try {
      // Simple approach: Update practitioner record directly
      const { error } = await window.supabase
        .from('Practitioners')
        .update({
          full_name: values.full_name.trim(),
          profession: values.profession,
        })
        .eq('id', practitioner.id);

      if (error) throw error;

      toast.success('Perfil completado com sucesso!');

      // Navigate based on journey context
      if (journeyParams.source === 'payment' && preservedPaymentData) {
        // Coming from payment - go to success page
        navigate('/pagamento-sucesso');
      } else {
        // Otherwise go to main app
        navigate('/');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error('Erro ao completar perfil. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show current user email for context
  const userEmail = user?.email || '';

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Complete seu perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Precisamos de algumas informações básicas para continuar
        </p>
        
        {userEmail && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 py-2 px-3 rounded-md">
            <CheckCircle className="w-4 h-4" />
            <span>Conta: {userEmail}</span>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Seu nome completo" 
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profession"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissão</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua profissão" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROFESSIONS.map((profession) => (
                      <SelectItem key={profession} value={profession}>
                        {profession}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Completar perfil'}
          </Button>
        </form>
      </Form>

      {preservedPaymentData && (
        <div className="text-xs text-center text-muted-foreground bg-blue-50 py-2 px-3 rounded-md">
          Seu pagamento foi processado. Complete o perfil para acessar sua conta.
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionForm;