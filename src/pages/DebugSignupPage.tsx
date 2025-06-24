
// ABOUTME: Debug page to help troubleshoot signup issues.
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DebugSignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  const addDebugInfo = (info: any) => {
    setDebugInfo(prev => [...prev, { timestamp: new Date().toISOString(), ...info }]);
  };

  const testSignup = async () => {
    setDebugInfo([]);
    addDebugInfo({ action: 'Starting signup test', email, fullName });

    try {
      // Test 1: Check Supabase connection
      addDebugInfo({ action: 'Testing Supabase connection' });
      const { data: connectionTest } = await supabase.from('Practitioners').select('count');
      addDebugInfo({ action: 'Connection test result', result: connectionTest });

      // Test 2: Attempt signup
      addDebugInfo({ action: 'Attempting signup' });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      addDebugInfo({ 
        action: 'Signup result', 
        success: !error,
        data: data ? {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email,
            confirmed_at: data.user.email_confirmed_at
          } : null,
          session: data.session ? 'session_created' : 'no_session'
        } : null,
        error: error ? {
          message: error.message,
          status: error.status,
          code: error.code
        } : null
      });

      if (data.user) {
        // Test 3: Check if user was created in auth.users
        addDebugInfo({ action: 'Checking auth.users table' });
        
        // Test 4: Check if trigger created profile
        setTimeout(async () => {
          const { data: profileData, error: profileError } = await supabase
            .from('Practitioners')
            .select('*')
            .eq('id', data.user.id);
          
          addDebugInfo({
            action: 'Profile creation check',
            profileData,
            profileError: profileError ? {
              message: profileError.message,
              code: profileError.code
            } : null
          });
        }, 2000);
      }

    } catch (err: any) {
      addDebugInfo({ 
        action: 'Unexpected error', 
        error: {
          message: err.message,
          stack: err.stack
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Signup Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={testSignup} className="w-full">
              Test Signup Process
            </Button>
          </CardContent>
        </Card>

        {debugInfo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DebugSignupPage;
