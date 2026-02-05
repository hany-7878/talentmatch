import type {  Tables } from './supabase';


export type Profile = Tables<'profiles'>;
export type JobProject = Tables<'projects'>;
export type Message = Tables<'messages'>;
export type Application = Tables<'applications'>;
export type Invitation = Tables<'invitations'>;
export type UserRole = 'manager' | 'seeker'; 

export interface ChatRoom extends Omit<Invitation, 'status'> {
  status: 'pending' | 'accepted' | 'declined';
  unread_count?: number;

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

export interface AppMessage extends Message {
  isOptimistic?: boolean;
 
  parsedReactions?: Reaction[];
}



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