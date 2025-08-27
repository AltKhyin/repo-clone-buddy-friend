// ABOUTME: Essential tests for RegistrationForm component focusing on form validation and birthday field

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegistrationForm from '../RegistrationForm';

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('RegistrationForm', () => {
  it('renders all required form fields', () => {
    render(<RegistrationForm />, { wrapper: TestWrapper });
    
    expect(screen.getByPlaceholderText('Nome completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('dd/mm/aaaa')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirmar senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument();
  });

  it('shows password mismatch validation error', async () => {
    render(<RegistrationForm />, { wrapper: TestWrapper });
    
    const passwordInput = screen.getByPlaceholderText('Senha');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirmar senha');
    const submitButton = screen.getByRole('button', { name: 'Criar conta' });
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Senhas não coincidem.')).toBeInTheDocument();
    });
  });

  it('shows required field validation errors', async () => {
    render(<RegistrationForm />, { wrapper: TestWrapper });
    
    const submitButton = screen.getByRole('button', { name: 'Criar conta' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Nome completo é obrigatório.')).toBeInTheDocument();
      expect(screen.getByText('Email inválido.')).toBeInTheDocument();
      expect(screen.getByText('Data de nascimento é obrigatória.')).toBeInTheDocument();
    });
  });
});