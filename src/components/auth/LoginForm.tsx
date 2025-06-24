
// ABOUTME: The user login form component, matching the visual replica.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useLoginMutation, loginSchema } from '@/hooks/mutations/useLoginMutation';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import GoogleIcon from '@/components/icons/GoogleIcon';

const LoginForm = () => {
  const navigate = useNavigate();
  const mutation = useLoginMutation();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Login bem-sucedido!');
        navigate('/');
      },
      onError: (error) => {
        toast.error('Email ou senha inválidos.');
        console.error(error);
      },
    });
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[350px]">
      <div className="flex items-center space-x-2 text-black">
        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
        <h2 className="text-xl font-serif tracking-tight">Sign In</h2>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    placeholder="Email"
                    {...field}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Password"
                    {...field}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                className="border-black data-[state=checked]:bg-black data-[state=checked]:border-black"
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-gray-700 select-none"
              >
                Remember me
              </label>
            </div>
            <button type="button" className="text-sm text-gray-700 hover:text-black">
              Forgot?
            </button>
          </div>
          
          <Button type="submit" className="w-full !mt-8 !bg-black hover:!bg-gray-800 !text-white" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </Form>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-600">
            or continue with
          </span>
        </div>
      </div>
      
      <div className="mt-6">
        <Button variant="outline" className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 flex items-center justify-center gap-2">
            <GoogleIcon />
            Google
        </Button>
      </div>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-700">
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('/signup')} className="text-black font-medium hover:underline">
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
