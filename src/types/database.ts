export type MatchMode = 'department' | 'individual'
export type MatchStatus = 'open' | 'matched' | 'cancelled'
export type ParticipantStatus = 'pending' | 'confirmed' | 'waitlisted' | 'rejected'
export type ContestAppStatus = 'waiting' | 'matched'
export type StudyStatus = 'recruiting' | 'active' | 'expired'
export type StudyAppStatus = 'pending' | 'accepted' | 'rejected'
export type NotifType = 'matched' | 'applied' | 'accepted' | 'rejected' | 'reminder' | 'cancelled' | 'message'
export type NotifRefType = 'sport' | 'contest' | 'study'
export type LocationType = 'online' | 'offline'

export interface User {
  id: string
  email: string
  name: string
  department: string
  student_number: string | null
  interest_tags: string[]
  created_at: string
}

export interface SportMatch {
  id: string
  creator_id: string
  match_mode: MatchMode
  sport_type: string
  dept_host: string | null
  dept_guest: string | null
  scheduled_at: string
  location: string
  min_players: number
  max_players: number
  deadline: string
  status: MatchStatus
  description: string | null
  created_at: string
  creator?: User
  sport_participants?: SportParticipant[]
}

export interface SportParticipant {
  id: string
  match_id: string
  user_id: string
  team_side: string
  intro: string | null
  status: ParticipantStatus
  joined_at: string
  user?: User
}
export interface MatchChat {
  id: string
  match_id: string
  sender_id: string
  receiver_id: string
  message: string
  is_read: boolean
  created_at: string
  sender?: User
  receiver?: User
}

export interface Contest {
  id: string
  title: string
  organizer: string
  category: string
  description: string | null
  deadline: string
  team_min: number
  team_max: number
  required_roles: string[]
  prize: string | null
  external_url: string | null
  created_at: string
  contest_applications?: ContestApplication[]
}

export interface ContestApplication {
  id: string
  contest_id: string
  user_id: string
  role_tag: string
  team_id: string | null
  status: ContestAppStatus
  message: string | null
  applied_at: string
  user?: User
}

export interface Study {
  id: string
  creator_id: string
  title: string
  category_tags: string[]
  description: string
  schedule: string
  location_type: LocationType
  location: string | null
  min_members: number
  max_members: number
  recruit_deadline: string
  status: StudyStatus
  created_at: string
  creator?: User
  study_applications?: StudyApplication[]
}

export interface StudyApplication {
  id: string
  study_id: string
  user_id: string
  message: string | null
  status: StudyAppStatus
  applied_at: string
  user?: User
}

export interface Notification {
  id: string
  user_id: string
  type: NotifType
  ref_type: NotifRefType
  ref_id: string
  message: string
  is_read: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<User, 'id'>>
      }
      sport_matches: {
        Row: SportMatch
        Insert: Omit<SportMatch, 'id' | 'created_at' | 'status' | 'creator' | 'sport_participants'> & {
          id?: string
          created_at?: string
          status?: MatchStatus
        }
        Update: Partial<Omit<SportMatch, 'id' | 'creator' | 'sport_participants'>>
      }
      sport_participants: {
        Row: SportParticipant
        Insert: Omit<SportParticipant, 'id' | 'joined_at' | 'status' | 'user'> & {
          id?: string
          joined_at?: string
          status?: ParticipantStatus
        }
        Update: Partial<Omit<SportParticipant, 'id' | 'user'>>
      }
      contests: {
        Row: Contest
        Insert: Omit<Contest, 'id' | 'created_at' | 'contest_applications'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Contest, 'id' | 'contest_applications'>>
      }
      contest_applications: {
        Row: ContestApplication
        Insert: Omit<ContestApplication, 'id' | 'applied_at' | 'status' | 'team_id' | 'user'> & {
          id?: string
          applied_at?: string
          status?: ContestAppStatus
          team_id?: string
        }
        Update: Partial<Omit<ContestApplication, 'id' | 'user'>>
      }
      studies: {
        Row: Study
        Insert: Omit<Study, 'id' | 'created_at' | 'status' | 'creator' | 'study_applications'> & {
          id?: string
          created_at?: string
          status?: StudyStatus
        }
        Update: Partial<Omit<Study, 'id' | 'creator' | 'study_applications'>>
      }
      study_applications: {
        Row: StudyApplication
        Insert: Omit<StudyApplication, 'id' | 'applied_at' | 'status' | 'user'> & {
          id?: string
          applied_at?: string
          status?: StudyAppStatus
        }
        Update: Partial<Omit<StudyApplication, 'id' | 'user'>>
      }
      match_chats: {
        Row: MatchChat
        Insert: Omit<MatchChat, 'id' | 'created_at' | 'is_read' | 'sender' | 'receiver'> & {
          id?: string
          created_at?: string
          is_read?: boolean
        }
        Update: Partial<Omit<MatchChat, 'id' | 'sender' | 'receiver'>>
      }      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'is_read'> & {
          id?: string
          created_at?: string
          is_read?: boolean
        }
        Update: Partial<Omit<Notification, 'id'>>
      }
  }
  Functions: {
    send_chat_notification: {
      Args: { p_receiver_id: string; p_match_id: string; p_preview: string }
      Returns: void
    }
  }
}