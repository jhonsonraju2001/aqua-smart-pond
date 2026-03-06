
-- Create cameras table
CREATE TABLE public.cameras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pond_id UUID REFERENCES public.ponds(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 81,
  rtsp_url TEXT,
  username TEXT,
  password TEXT,
  stream_type TEXT NOT NULL DEFAULT 'mjpeg',
  stream_quality TEXT NOT NULL DEFAULT 'medium',
  resolution TEXT DEFAULT '1280x720',
  frame_rate INTEGER DEFAULT 15,
  audio_enabled BOOLEAN NOT NULL DEFAULT false,
  motion_detection_enabled BOOLEAN NOT NULL DEFAULT false,
  motion_sensitivity INTEGER NOT NULL DEFAULT 50,
  motion_alerts_enabled BOOLEAN NOT NULL DEFAULT false,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own cameras"
  ON public.cameras FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cameras"
  ON public.cameras FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cameras"
  ON public.cameras FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cameras"
  ON public.cameras FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create camera_snapshots table
CREATE TABLE public.camera_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_motion_triggered BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.camera_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snapshots"
  ON public.camera_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
  ON public.camera_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshots"
  ON public.camera_snapshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create camera_recordings table
CREATE TABLE public.camera_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  video_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  recording_type TEXT NOT NULL DEFAULT 'manual',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'recording'
);

ALTER TABLE public.camera_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recordings"
  ON public.camera_recordings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings"
  ON public.camera_recordings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings"
  ON public.camera_recordings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings"
  ON public.camera_recordings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger for cameras
CREATE TRIGGER update_cameras_updated_at
  BEFORE UPDATE ON public.cameras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
