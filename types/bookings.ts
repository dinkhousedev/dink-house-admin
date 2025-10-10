export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type BookingSource = "player_app" | "admin_dashboard";

export interface Court {
  id: string;
  court_number: number;
  environment: string;
  surface_type?: string;
}

export interface CourtBooking {
  id: string;
  event_id: string;
  event_title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  courts: Court[];
  player_id?: string;
  player_name?: string;
  player_email?: string;
  amount_paid: number;
  payment_status: PaymentStatus;
  booking_source: BookingSource;
  booked_by_staff: boolean;
  staff_user_id?: string;
  registration_time: string;
  cancellation_reason?: string;
  notes?: string;
}

export interface Player {
  id: string;
  account_id: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  email?: string;
  phone?: string;
  membership_level: "guest" | "basic" | "premium" | "vip";
  skill_level?: string;
  dupr_rating?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BookingFilters {
  date_from?: string;
  date_to?: string;
  court_id?: string;
  payment_status?: PaymentStatus;
  booking_source?: BookingSource;
  player_id?: string;
}
