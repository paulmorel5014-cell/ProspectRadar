export interface Prospect {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  website: string;
  category: string;
  city: string;
  status: 'À contacter' | 'En cours' | 'Gagné' | 'Perdu';
  opportunity_score: number;
  audit_json: string;
  created_at: string;
  follow_up_date?: string;
  tags?: string[];
  uid: string;
  lat?: number;
  lng?: number;
  notes?: string;
  activity_log?: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change';
  content: string;
  timestamp: string;
}

export interface AuditData {
  mobile_friendly?: boolean;
  mobile_details?: string;
  design_quality?: string;
  design_details?: string;
  seo_score?: number;
  seo_details?: string;
  summary?: string;
  digital_health_score?: number;
  sales_message?: string;
  email_draft?: string;
  has_website?: boolean;
  is_secure?: boolean;
  last_scan?: string;
  // New fields
  annual_loss?: number;
  loss_details?: string;
  mockup_html?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  super_powers?: string[];
  style_variant?: 'elegance' | 'industrial' | 'organic';
  current_performance_score?: number;
  new_performance_score?: number;
  performance_critique?: string;
  mailto_link?: string;
  gmail_link?: string;
  social_media_details?: string;
  social_media_score?: number;
  reviews_details?: string;
  reviews_score?: number;
  contact_visibility_details?: string;
  contact_visibility_score?: number;
}
