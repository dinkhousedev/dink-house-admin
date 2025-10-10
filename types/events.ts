export type EventType =
  | "event_scramble"
  | "dupr_open_play"
  | "dupr_tournament"
  | "non_dupr_tournament"
  | "league"
  | "clinic"
  | "private_lesson"
  | "open_play";

export type CourtSurface = "hard" | "clay" | "grass" | "indoor";
export type CourtEnvironment = "indoor" | "outdoor";
export type CourtStatus = "available" | "maintenance" | "reserved" | "closed";
export type SkillLevel =
  | "2.0"
  | "2.5"
  | "3.0"
  | "3.5"
  | "4.0"
  | "4.5"
  | "5.0"
  | "5.0+";
export type RecurrenceFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";
export type RegistrationStatus =
  | "registered"
  | "waitlisted"
  | "cancelled"
  | "no_show";

export interface Court {
  id: string;
  court_number: number;
  name: string;
  surface_type: CourtSurface;
  environment: CourtEnvironment;
  status: CourtStatus;
  location?: string;
  features?: string[];
  max_capacity: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  event_type: EventType;
  duration_minutes: number;
  max_capacity: number;
  min_capacity: number;
  skill_levels: SkillLevel[];
  price_member: number;
  price_guest: number;
  court_preferences?: {
    count?: number;
    preferred_courts?: number[];
  };
  equipment_provided: boolean;
  settings?: Record<string, any>;
  is_active: boolean;
  times_used?: number;
  last_used?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  template_id?: string;
  template_name?: string;

  // Scheduling
  start_time: string;
  end_time: string;
  check_in_time?: string;

  // Capacity
  max_capacity: number;
  min_capacity: number;
  current_registrations: number;
  waitlist_capacity: number;

  // Requirements
  skill_levels: SkillLevel[];
  member_only: boolean;

  // DUPR Fields
  dupr_bracket_id?: string;
  dupr_range_label?: string;
  dupr_min_rating?: number;
  dupr_max_rating?: number;
  dupr_open_ended?: boolean;
  dupr_min_inclusive?: boolean;
  dupr_max_inclusive?: boolean;

  // Pricing
  price_member: number;
  price_guest: number;

  // Status
  is_published: boolean;
  is_cancelled: boolean;
  cancellation_reason?: string;
  registration_status: "full" | "almost_full" | "needs_players" | "open";

  // Features
  equipment_provided: boolean;
  special_instructions?: string;
  settings?: Record<string, any>;

  // Courts
  courts: EventCourt[];

  // Series info
  series_id?: string;
  series_name?: string;
  recurrence_frequency?: RecurrenceFrequency;

  // Staff-specific fields
  staff_notes?: string;
  setup_requirements?: {
    equipment: string[];
    staffing: string[];
    other: string[];
  };
  instructor_id?: string;
  registration_deadline?: string;
  confirmation_email_sent?: boolean;

  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EventCourt {
  id: string;
  court_number: number;
  name: string;
  surface_type: CourtSurface;
  is_primary: boolean;
}

export interface RecurrencePattern {
  id: string;
  event_id: string;
  frequency: RecurrenceFrequency;
  interval_count: number;
  days_of_week?: number[]; // 0=Sunday, 6=Saturday
  day_of_month?: number;
  week_of_month?: number;
  series_start_date: string;
  series_end_date?: string;
  occurrences_count?: number;
  timezone: string;
}

export interface EventSeries {
  id: string;
  series_name: string;
  parent_event_id?: string;
  recurrence_pattern_id: string;
  total_instances?: number;
  regular_instances?: number;
  exception_instances?: number;
  next_occurrence?: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id?: string;

  // Player info
  player_name?: string;
  player_email?: string;
  player_phone?: string;
  skill_level?: SkillLevel;
  dupr_rating?: number;

  // Registration details
  status: RegistrationStatus;
  registration_time: string;
  check_in_time?: string;

  // Payment
  amount_paid: number;
  payment_method?: string;
  payment_reference?: string;

  // Notes
  notes?: string;
  special_requests?: string;

  // Event details (when joined)
  event_title?: string;
  event_type?: EventType;
  event_start_time?: string;
  event_end_time?: string;
}

export interface CourtAvailability {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string;
  bookings?: {
    start_time: string;
    end_time: string;
    event_title: string;
    event_type: EventType;
  }[];
}

// Form types
export interface EventFormData {
  title: string;
  description?: string;
  event_type: EventType;
  template_id?: string;
  start_time: string;
  end_time: string;
  court_ids: string[];
  max_capacity: number;
  min_capacity: number;
  skill_levels: SkillLevel[];
  member_only: boolean;
  price_member: number;
  price_guest: number;
  equipment_provided: boolean;
  special_instructions?: string;
  // Staff fields
  staff_notes?: string;
  setup_requirements?: {
    equipment: string[];
    staffing: string[];
    other: string[];
  };
  instructor_id?: string;
  registration_deadline?: string;
  waitlist_capacity?: number;
  check_in_time?: string;
}

export interface RecurrenceFormData {
  frequency: RecurrenceFrequency;
  interval_count: number;
  days_of_week?: number[];
  series_start_date: string;
  series_end_date: string;
  exceptions?: string[];
}

// API Response types
export interface EventCalendarResponse {
  events: CalendarEvent[];
  summary: {
    total_events: number;
    total_capacity: number;
    total_registered: number;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: EventType;
  start: string;
  end: string;
  color: string;
  capacity: number;
  registered: number;
  courts: number[];
}

export interface CourtAvailabilityCheck {
  available_courts: {
    court_id: string;
    court_number: number;
    court_name: string;
  }[];
  unavailable_courts: {
    court_id: string;
    court_number: number;
    court_name: string;
    status: CourtStatus;
    conflicts?: {
      event_id: string;
      event_title: string;
      start_time: string;
      end_time: string;
    }[];
  }[];
  all_available: boolean;
}

export interface CourtAvailabilityResponse {
  court: Court;
  available: boolean;
  conflicts: Event[];
}

// Calendar view types
export type CalendarView = "month" | "week" | "day" | "courts";

export interface CalendarViewOptions {
  view: CalendarView;
  date: Date;
  eventTypes?: EventType[];
  courtIds?: string[];
  showCancelled?: boolean;
}

// Helper type for event colors
export const EventColors: Record<EventType, string> = {
  event_scramble: "#B3FF00", // Dink Lime
  dupr_open_play: "#0EA5E9", // Blue
  dupr_tournament: "#1D4ED8", // Indigo
  non_dupr_tournament: "#EF4444", // Red
  league: "#8B5CF6", // Purple
  clinic: "#10B981", // Green
  private_lesson: "#64748B", // Gray
  open_play: "#B3FF00", // Dink Lime (same as event_scramble)
};
