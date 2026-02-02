import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePondData } from '@/hooks/usePondData';
import { Loader2, Waves } from 'lucide-react';
import PondHome from './PondHome';
import PondSelection from './PondSelection';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const { ponds, isLoading: pondsLoading } = usePondData();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Redirect admins to admin panel
  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      navigate('/admin');
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  if (authLoading || pondsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your ponds...</p>
      </div>
    );
  }

  if (!isAuthenticated || isAdmin) {
    return null;
  }

  // No ponds assigned to user - show helpful message
  if (ponds.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <Waves className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">No Ponds Assigned</h2>
        <p className="text-muted-foreground text-center text-sm max-w-sm mb-6">
          No ponds are currently assigned to your account. Please contact your administrator or add a new pond from Settings.
        </p>
        <button 
          onClick={() => navigate('/settings')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  // Single pond user → go to pond home with action buttons
  if (ponds.length === 1) {
    return <PondHome />;
  }

  // Multi-pond user → show pond selection
  return <PondSelection />;
}
