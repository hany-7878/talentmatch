import type {  Tables } from './supabase';

/* ================= DATABASE ENTITY TYPES ================= */
// We use the 'Tables' helper to extract the exact shape from your Supabase schema

export type Profile = Tables<'profiles'>;
export type JobProject = Tables<'projects'>;
export type Message = Tables<'messages'>;
export type Application = Tables<'applications'>;
export type Invitation = Tables<'invitations'>;
// src/types/index.ts
export type UserRole = 'manager' | 'seeker'; 

/* ================= EXTENDED / UI TYPES ================= */

// We can extend the base types for specific UI needs (like Chat)
export interface ChatRoom extends Omit<Invitation, 'status'> {
  // Use string literal unions for stricter status control
  status: 'pending' | 'accepted' | 'declined';
  unread_count?: number;
  
  // Relational data from joins (matches your Supabase query structure)
  seeker_profiles?: Pick<Profile, 'full_name' | 'avatar_url'>;
  projects?: Pick<JobProject, 'id' | 'title' | 'manager_id'> & {
    profiles: Pick<Profile, 'full_name' | 'avatar_url'>;
  };
}

export interface Reaction {
  user_id: string;
  emoji: string;
  full_name: string | null;
}

// We wrap the DB Message to add UI-only flags like 'isOptimistic'
export interface AppMessage extends Message {
  isOptimistic?: boolean;
  // Parse the JSON reactions column from the DB into our Reaction interface
  parsedReactions?: Reaction[];
}

/* ================= COMPONENT PROPS ================= */

export interface MessageContainerProps {
  groupedMessages: Record<string, AppMessage[]>;
  currentUserId?: string;
  partnerTyping: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

export interface MessageInputProps {
  text: string;
  setText: (val: string) => void;
  onSend: (file?: File | null) => void;
  onTyping: (val: string) => void;
  isSending: boolean;
}

export interface ChatSidebarProps {
  chats: ChatRoom[];
  activeChatId?: string; 
  onSelect: (chat: ChatRoom) => void;
  profile?: Pick<Profile, 'full_name' | 'role' | 'avatar_url'>;
  onMarkAllRead: () => void;
  isOpen: boolean;
  onClose: () => void;
}