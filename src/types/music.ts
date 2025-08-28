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
}

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface GeneratedMusic {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  imageUrl: string;
  genre: string[];
  ipfsHash?: string;
  metadata?: IPFSMetadata;
  taskId: string;
  createdAt: string;
}