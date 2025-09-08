// ABOUTME: Simple auth method conflict alert to guide users to correct login method

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail } from 'lucide-react';
import GoogleIcon from '@/components/icons/GoogleIcon';

interface AuthConflictAlertProps {
  email: string;
  existingMethod: 'email' | 'google';
  message: string;
  onUseCorrectMethod: () => void;
  onDismiss?: () => void;
}

const AuthConflictAlert = ({
  email,
  existingMethod,
  message,
  onUseCorrectMethod,
  onDismiss
}: AuthConflictAlertProps) => {
  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="space-y-3">
        <div className="text-sm text-orange-800">
          <p className="font-medium mb-1">Conta já existe com outro método</p>
          <p>{message}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUseCorrectMethod}
            className="bg-white border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            {existingMethod === 'google' ? (
              <>
                <GoogleIcon className="w-4 h-4 mr-2" />
                Entrar com Google
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Usar email e senha
              </>
            )}
          </Button>
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-orange-700 hover:bg-orange-50"
            >
              Entendi
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AuthConflictAlert;