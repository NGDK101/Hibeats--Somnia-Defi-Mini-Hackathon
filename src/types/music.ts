// Profile and Social Types
export interface UserProfile {
  address: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage: string;
  website: string;
  socialLinks: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: number;
  followerCount: number;
  followingCount: number;
  trackCount: number;
  totalPlays: number;
  totalEarnings: number;
}

export interface FollowStats {
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isFollower?: boolean;
  followTimestamp?: number;
}

export enum CreatorLevel {
  NEWCOMER = "NEWCOMER",
  RISING = "RISING", 
  ESTABLISHED = "ESTABLISHED",
  LEGEND = "LEGEND"
}

export interface GeneratedTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  imageUrl: string;
  genre: string[];
  lyrics?: string;
  ipfsHash?: string;
  metadata?: IPFSMetadata;
  taskId: string;
  createdAt: string;
}

export interface SocialActivity {
  id: string;
  type: "follow" | "unfollow" | "track_created" | "track_liked" | "playlist_created";
  user: UserProfile;
  target?: UserProfile;
  track?: GeneratedTrack;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface SunoGenerateRequest {
  prompt: string;
  style?: string;
  title?: string;
  customMode: boolean;
  instrumental: boolean;
  model: "V3_5" | "V4" | "V4_5";
  negativeTags?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  callBackUrl?: string;
  customCoverImage?: string; // Optional custom cover image URL
}

export interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface SunoTrackData {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  prompt: string;
  modelName: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number;
}

export interface SunoTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    parentMusicId: string;
    param: string;
    response: {
      taskId: string;
      sunoData: SunoTrackData[];
    };
    status: "PENDING" | "TEXT_SUCCESS" | "FIRST_SUCCESS" | "SUCCESS" | "CREATE_TASK_FAILED" | "GENERATE_AUDIO_FAILED" | "CALLBACK_EXCEPTION" | "SENSITIVE_WORD_ERROR";
    type: string;
    operationType: string;
    errorCode: number | null;
    errorMessage: string | null;
  };
}

export interface IPFSMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  audio_url: string;
  duration: number;
  genre: string[];
  created_by: string;
  model_used: string;
  generation_date: string;
  prompt?: string;
  transaction_hash?: string;
  task_id?: string;
  instrumental?: boolean;
  custom_mode?: boolean;
  style?: string;
  title_custom?: string;
  vocal_gender?: string;
  negative_tags?: string;
  style_weight?: number;
  weirdness_constraint?: number;
  audio_weight?: number;
}

export interface PinataResponse {
  id: string;
  name: string;
  cid?: string;
  IpfsHash?: string; // For backward compatibility
  size: number;
  number_of_files: number;
  mime_type: string;
  group_id: string | null;
  created_at: string;
  PinSize?: number; // For backward compatibility
  Timestamp?: string; // For backward compatibility
}

export interface GeneratedMusic {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  imageUrl: string;
  originalAudioUrl?: string; // Original URL from Suno for fallback
  originalImageUrl?: string; // Original URL from Suno for fallback
  genre: string[];
  lyrics?: string;
  ipfsHash?: string;
  metadata?: IPFSMetadata;
  taskId: string;
  createdAt: string;
  version?: string; // v1, v2, etc. to distinguish songs with same taskId
}