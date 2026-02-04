import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'MANAGER' | 'SEEKER';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  settings?: any;
  
  // Seeker Specifics
  skills: string[] | null;
  experience_level: 'Junior' | 'Intermediate' | 'Senior' | null;
  resume_url: string | null;
  website_url: string | null;
  
  updated_at: string | null;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>; 
}

export interface JobProject {
  id: string;
  title: string;
  description: string;
  manager_id: string;
  status: 'open' | 'closed';
  requirements?: string[];
  created_at: string;
}

export interface Application {
  id: string;
  project_id: string;
  user_id: string;
  status: 'Applied' | 'Viewed' | 'Shortlisted' | 'Rejected';
  match_score: number;
  created_at: string;
  projects?: JobProject; 
  description: string;
  requirements: string[]; 
   location_type: string;
  budget?: string;
  title: string;
}

interface HandshakeInfo {
  name: string;
  email: string;
}

interface JobDetailProps {
  job: any;
  userRole: 'MANAGER' | 'SEEKER';
  onBack: () => void;
  onApply?: (pitch: string) => Promise<void> | void; 
  onEdit?: (job: any) => void;
  onUpdateApplicantStatus?: (appId: string, newStatus: string) => Promise<void>;
  isApplied: boolean; 
  isConnected?: boolean; // NEW PROP
  applicants?: any[]; 
}

// src/types/index.ts

export interface MessageReaction {
  user_id: string;
  emoji: string;
}

export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url: string | null;
  file_type: string | null;
  is_read: boolean;
  message_reactions: any[]; // Ensure this matches your DB column name
  isOptimistic?: boolean;
}

export interface ChatRoom {
  project_id: string;
  status: 'pending' | 'accepted' | 'declined';
  last_read_at: string;
  projects: {
    id: string;
    title: string;
    manager_id: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
  };
}