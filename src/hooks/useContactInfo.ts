// ABOUTME: Hook for consuming customer support contact information throughout the app

import { useCustomerSupportSettings, getPrimaryContact, type CustomerSupportSettings } from './useCustomerSupportSettings';

export interface ContactInfo {
  email: string;
  displayText: string;
  href: string;
  isLoading: boolean;
}

/**
 * Hook that provides current customer support contact information
 * Falls back to default email if no settings are configured
 */
export const useContactInfo = (): ContactInfo => {
  const { data: settings, isLoading } = useCustomerSupportSettings();
  
  // Return default contact info while loading or if no settings
  if (isLoading || !settings) {
    return {
      email: 'suporte@igoreckert.com.br',
      displayText: 'suporte@igoreckert.com.br',
      href: 'mailto:suporte@igoreckert.com.br',
      isLoading
    };
  }
  
  const primaryContact = getPrimaryContact(settings);
  
  return {
    email: settings.mode === 'advanced' ? settings.email : 'suporte@igoreckert.com.br',
    displayText: primaryContact.value,
    href: primaryContact.formatted,
    isLoading: false
  };
};

/**
 * Hook that provides formatted contact text for use in error messages and forms
 */
export const useContactText = (): {
  contactText: string;
  contactLink: string;
  isLoading: boolean;
} => {
  const { email, href, isLoading } = useContactInfo();
  
  return {
    contactText: `Entre em contato conosco: ${email}`,
    contactLink: href,
    isLoading
  };
};