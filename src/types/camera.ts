export interface Camera {
  id: string;
  user_id: string;
  pond_id: string | null;
  name: string;
  ip_address: string;
  port: number;
  rtsp_url: string | null;
  username: string | null;
  password: string | null;
  stream_type: 'mjpeg' | 'rtsp';
  stream_quality: 'low' | 'medium' | 'hd';
  resolution: string | null;
  frame_rate: number | null;
  audio_enabled: boolean;
  motion_detection_enabled: boolean;
  motion_sensitivity: number;
  motion_alerts_enabled: boolean;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface CameraSnapshot {
  id: string;
  camera_id: string;
  user_id: string;
  image_url: string;
  thumbnail_url: string | null;
  captured_at: string;
  is_motion_triggered: boolean;
}

export interface CameraRecording {
  id: string;
  camera_id: string;
  user_id: string;
  video_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  recording_type: 'manual' | 'motion' | 'scheduled';
  started_at: string;
  ended_at: string | null;
  status: 'recording' | 'completed' | 'failed';
}

export interface CameraFormData {
  name: string;
  ip_address: string;
  port: number;
  rtsp_url: string;
  username: string;
  password: string;
  stream_type: 'mjpeg' | 'rtsp';
  pond_id: string | null;
}
