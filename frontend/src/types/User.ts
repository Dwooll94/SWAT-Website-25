export interface Guardian {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

export interface User {
  id: string;
  email: string;
  school_email?: string;
  role: string;
  registration_status: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  graduation_year?: number;
  gender?: string;
  food_allergies?: string;
  medical_conditions?: string;
  heard_about_team?: string;
  maintenance_access: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  guardian_count: number;
  guardians?: Guardian[];
  is_core_leadership?: boolean;
}