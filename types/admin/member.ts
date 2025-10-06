// Member management types for admin panel

export type MembershipLevel = "guest" | "basic" | "premium" | "vip";
export type ProfileStatus = "incomplete" | "pending_verification" | "verified";
export type TransactionStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "partially_refunded";

export interface Member {
  id: string;
  account_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  street_address?: string;
  city?: string;
  state?: string;
  dupr_rating?: number;
  dupr_verified: boolean;
  dupr_verified_at?: string;
  dupr_verification_notes?: string;
  membership_level: MembershipLevel;
  stripe_customer_id?: string;
  is_active: boolean;
  created_at: string;
  profile_status: ProfileStatus;
}

export interface Transaction {
  id: string;
  player_id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description?: string;
  payment_method?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  created_at: string;
  refunded_at?: string;
  refund_amount?: number;
  refund_reason?: string;
}

export interface MembersListResponse {
  success: boolean;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  members: Member[];
}

export interface MemberTransactionsResponse {
  success: boolean;
  transactions: Transaction[];
}

export interface VerifyDUPRPayload {
  player_id: string;
  verified: boolean;
  verified_by: string;
  notes?: string;
}

export interface UpdateMemberPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  street_address?: string;
  city?: string;
  state?: string;
  membership_level?: MembershipLevel;
  is_active?: boolean;
}

export interface DeleteMemberPayload {
  player_id: string;
  deleted_by: string;
  reason: string;
}

export interface RefundPayload {
  transaction_id: string;
  amount?: number;
  reason: string;
}
