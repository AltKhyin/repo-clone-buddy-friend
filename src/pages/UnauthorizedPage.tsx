
// ABOUTME: Unauthorized access page with proper Portuguese messaging and navigation

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Acesso Negado
          </CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página. Entre em contato com um administrador se acredita que isso é um erro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGoHome}
            className="w-full"
            variant="default"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir para Início
          </Button>
          <Button 
            onClick={handleGoBack}
            className="w-full"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
