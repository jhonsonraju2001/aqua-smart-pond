import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ref, set, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { toast } from 'sonner';
import type { Camera, CameraFormData, CameraSnapshot, CameraRecording } from '@/types/camera';

export function useCameras() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [snapshots, setSnapshots] = useState<CameraSnapshot[]>([]);
  const [recordings, setRecordings] = useState<CameraRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCameras((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching cameras:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSnapshots = useCallback(async (cameraId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('camera_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('captured_at', { ascending: false })
        .limit(50);

      if (cameraId) {
        query = query.eq('camera_id', cameraId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSnapshots((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching snapshots:', err);
    }
  }, []);

  const fetchRecordings = useCallback(async (cameraId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('camera_recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (cameraId) {
        query = query.eq('camera_id', cameraId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecordings((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching recordings:', err);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
    fetchSnapshots();
    fetchRecordings();
  }, [fetchCameras, fetchSnapshots, fetchRecordings]);

  const addCamera = useCallback(async (formData: CameraFormData): Promise<Camera | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('cameras')
        .insert({
          user_id: userId,
          name: formData.name,
          ip_address: formData.ip_address,
          port: formData.port,
          rtsp_url: formData.rtsp_url || null,
          username: formData.username || null,
          password: formData.password || null,
          stream_type: formData.stream_type,
          pond_id: formData.pond_id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      const camera = data as any as Camera;
      setCameras(prev => [camera, ...prev]);

      // Sync to Firebase
      if (database && camera.pond_id) {
        await set(ref(database, `ponds/${camera.pond_id}/cameras/${camera.id}`), {
          name: camera.name,
          ip_address: camera.ip_address,
          port: camera.port,
          stream_type: camera.stream_type,
          is_online: false,
        });
      }

      toast.success(`Camera "${formData.name}" added successfully`);
      return camera;
    } catch (err) {
      console.error('Error adding camera:', err);
      toast.error('Failed to add camera');
      return null;
    }
  }, [userId]);

  const updateCamera = useCallback(async (id: string, updates: Partial<Camera>) => {
    try {
      const { error } = await supabase
        .from('cameras')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;

      setCameras(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Camera updated');
    } catch (err) {
      console.error('Error updating camera:', err);
      toast.error('Failed to update camera');
    }
  }, []);

  const deleteCamera = useCallback(async (id: string) => {
    try {
      const camera = cameras.find(c => c.id === id);
      
      const { error } = await supabase
        .from('cameras')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCameras(prev => prev.filter(c => c.id !== id));

      // Remove from Firebase
      if (database && camera?.pond_id) {
        await set(ref(database, `ponds/${camera.pond_id}/cameras/${id}`), null);
      }

      toast.success('Camera deleted');
    } catch (err) {
      console.error('Error deleting camera:', err);
      toast.error('Failed to delete camera');
    }
  }, [cameras]);

  const testConnection = useCallback(async (ip: string, port: number): Promise<boolean> => {
    // In a web context, we can test MJPEG streams by attempting to load an image
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.src = '';
        resolve(false);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      img.src = `http://${ip}:${port}/capture?_t=${Date.now()}`;
    });
  }, []);

  const getStreamUrl = useCallback((camera: Camera): string => {
    if (camera.stream_type === 'rtsp' && camera.rtsp_url) {
      return camera.rtsp_url;
    }
    // Default MJPEG stream URL (ESP32-CAM format)
    return `http://${camera.ip_address}:${camera.port}/stream`;
  }, []);

  const getCaptureUrl = useCallback((camera: Camera): string => {
    return `http://${camera.ip_address}:${camera.port}/capture`;
  }, []);

  return {
    cameras,
    snapshots,
    recordings,
    isLoading,
    addCamera,
    updateCamera,
    deleteCamera,
    testConnection,
    getStreamUrl,
    getCaptureUrl,
    fetchSnapshots,
    fetchRecordings,
    refetch: fetchCameras,
  };
}
