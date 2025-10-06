export interface PendingDUPRVerification {
  id: string;
  account_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  dupr_rating: number;
  submitted_at: string;
  membership_level: string;
  created_at: string;
}

export interface PendingVerificationsResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  data: PendingDUPRVerification[];
  error?: string;
}

export interface VerifyDUPRPayload {
  player_id: string;
  admin_id: string;
  verified: boolean;
  notes?: string;
}

export interface VerifyDUPRResponse {
  success: boolean;
  message?: string;
  player_name?: string;
  dupr_rating?: number;
  error?: string;
}
