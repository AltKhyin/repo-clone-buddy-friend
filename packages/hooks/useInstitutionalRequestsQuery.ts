// ABOUTME: TanStack Query hook for fetching institutional plan requests with admin data

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface InstitutionalRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  business_name: string;
  specific_needs: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  reviewed_by?: {
    id: string;
    full_name: string;
  } | null;
}

const fetchInstitutionalRequests = async (): Promise<InstitutionalRequest[]> => {
  const { data, error } = await supabase
    .from('institutional_plan_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch institutional requests: ${error.message}`);
  }

  // For now, return data without reviewer info to avoid relationship issues
  // TODO: Add reviewer info lookup when schema cache is refreshed
  return (data || []).map(request => ({
    ...request,
    reviewed_by: null // Simplified for now
  }));
};

export const useInstitutionalRequestsQuery = () => {
  return useQuery({
    queryKey: ['admin', 'institutional-requests'],
    queryFn: fetchInstitutionalRequests,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};