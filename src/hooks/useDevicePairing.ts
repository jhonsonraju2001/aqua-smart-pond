import { useState, useCallback } from 'react';
import { ref, set, get, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PairingResult {
  success: boolean;
  pondId?: string;
  pairingCode?: string;
  error?: string;
}

interface UseDevicePairingReturn {
  isPairing: boolean;
  generatePondId: () => string;
  createPond: (name: string, deviceIp: string, location?: string) => Promise<PairingResult>;
  regeneratePairingCode: (pondId: string, pondName: string) => Promise<string | null>;
  verifyPairing: (pondId: string) => Promise<boolean>;
}

// Generate a unique pond ID
function generateUniquePondId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 6);
  return `pond_${timestamp}_${randomPart}`.toUpperCase();
}

// Generate a 6-character alphanumeric pairing code
function generateNewPairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useDevicePairing(): UseDevicePairingReturn {
  const [isPairing, setIsPairing] = useState(false);
  const { user } = useAuth();

  const generatePondId = useCallback(() => {
    return generateUniquePondId();
  }, []);

  const createPond = useCallback(async (
    name: string,
    deviceIp: string,
    location?: string
  ): Promise<PairingResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsPairing(true);
    try {
      const pondId = generateUniquePondId();
      const pairingCode = generateNewPairingCode();

      // 1. Create in Supabase
      const { error: supabaseError } = await supabase.from('ponds').insert({
        name,
        device_ip: deviceIp,
        location: location || null,
        user_id: user.id,
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // 2. Initialize in Firebase with proper structure
      if (database) {
        await set(ref(database, `ponds/${pondId}`), {
          name,
          ownerId: user.id,
          deviceIp,
          location: location || null,
          createdAt: Date.now(),
          status: {
            online: false,
            lastSeen: null,
          },
          sensors: {
            temperature: 0,
            ph: 0,
            dissolvedOxygen: 0,
            turbidity: 0,
          },
          devices: {
            motor: { state: 0, mode: 'manual' },
            aerator: { state: 0, mode: 'manual' },
            light: { state: 0, mode: 'manual' },
          },
          schedules: {},
          config: {
            pairingCode,
            pairingCodeExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            paired: false,
          },
          access: {
            [user.id]: {
              role: 'admin',
              grantedAt: Date.now(),
              grantedBy: user.id,
            },
          },
        });
      }

      toast.success('Pond created! Use the pairing code to connect your device.');
      return { success: true, pondId, pairingCode };
    } catch (err) {
      console.error('Error creating pond:', err);
      const message = err instanceof Error ? err.message : 'Failed to create pond';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsPairing(false);
    }
  }, [user]);

  const regeneratePairingCode = useCallback(async (
    pondId: string,
    pondName: string
  ): Promise<string | null> => {
    if (!database) return null;

    try {
      const code = generateNewPairingCode();
      
      await set(ref(database, `ponds/${pondId}/config/pairingCode`), code);
      await set(ref(database, `ponds/${pondId}/config/pairingCodeExpires`), Date.now() + 24 * 60 * 60 * 1000);
      
      // Also store in a global lookup for easy ESP32 verification
      await set(ref(database, `pairingCodes/${code}`), {
        pondId,
        pondName,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      return code;
    } catch (err) {
      console.error('Error generating pairing code:', err);
      return null;
    }
  }, []);

  const verifyPairing = useCallback(async (pondId: string): Promise<boolean> => {
    if (!database) return false;

    try {
      const snapshot = await get(ref(database, `ponds/${pondId}/config/paired`));
      return snapshot.val() === true;
    } catch (err) {
      console.error('Error verifying pairing:', err);
      return false;
    }
  }, []);

  return {
    isPairing,
    generatePondId,
    createPond,
    regeneratePairingCode,
    verifyPairing,
  };
}
