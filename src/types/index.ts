export interface NPCObject {
  id: string;
  name: string;
  personality: string;
  backstory: string;
  voice_description: string;
  image_url: string;
  original_image_url: string;
  voice_id?: string;
  times_talked_to: number;
  created_at: string;
}

export interface IdentifyResponse {
  name: string;
  personality: string;
  backstory: string;
  voice_description: string;
}

export interface GenerateImageResponse {
  image_url: string;
}
