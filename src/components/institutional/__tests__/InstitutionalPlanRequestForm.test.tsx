// ABOUTME: Essential tests for InstitutionalPlanRequestForm ensuring core functionality works

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstitutionalPlanRequestForm } from '../InstitutionalPlanRequestForm';

// Mock the hooks and toast
vi.mock('../../../../packages/hooks/useSubmitInstitutionalRequestMutation', () => ({
  useSubmitInstitutionalRequestMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ message: 'Success' }),
    isPending: false
  })
}));

vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('InstitutionalPlanRequestForm', () => {
  it('should render form with all required fields', () => {
    render(<InstitutionalPlanRequestForm />);

    // Check form title
    expect(screen.getByText('Plano Institucional')).toBeInTheDocument();

    // Check all required form fields are present
    expect(screen.getByPlaceholderText('Seu nome completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(11) 99999-9999')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nome da sua empresa')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Descreva aproximadamente quantos acessos deseja e qualquer outra dúvida que tenha')).toBeInTheDocument();

    // Check submit button
    expect(screen.getByRole('button', { name: 'Solicitar Plano Institucional' })).toBeInTheDocument();
  });

  it('should show validation errors for invalid inputs', async () => {
    const user = userEvent.setup();
    render(<InstitutionalPlanRequestForm />);

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: 'Solicitar Plano Institucional' });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
      expect(screen.getByText('Nome da empresa é obrigatório')).toBeInTheDocument();
    });
  });

  it('should validate phone number format', async () => {
    const user = userEvent.setup();
    render(<InstitutionalPlanRequestForm />);

    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    await user.type(phoneInput, 'invalid-phone');

    const submitButton = screen.getByRole('button', { name: 'Solicitar Plano Institucional' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Telefone inválido. Use: (11) 99999-9999')).toBeInTheDocument();
    });
  });

  it('should successfully submit valid form', async () => {
    const user = userEvent.setup();
    render(<InstitutionalPlanRequestForm />);

    // Fill out form with valid data
    await user.type(screen.getByPlaceholderText('Seu nome completo'), 'João Silva');
    await user.type(screen.getByPlaceholderText('(11) 99999-9999'), '(11) 99999-9999');
    await user.type(screen.getByPlaceholderText('email'), 'joao@empresa.com');
    await user.type(screen.getByPlaceholderText('Nome da sua empresa'), 'Empresa Teste');
    await user.type(screen.getByPlaceholderText('Descreva aproximadamente quantos acessos deseja e qualquer outra dúvida que tenha'), 'Precisamos de 10 acessos para nossa equipe de desenvolvimento');

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Solicitar Plano Institucional' });
    await user.click(submitButton);

    // Should show success state
    await waitFor(() => {
      expect(screen.getByText('Solicitação enviada!')).toBeInTheDocument();
    });
  });
});