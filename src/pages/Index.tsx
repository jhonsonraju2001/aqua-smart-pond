import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePondData } from '@/hooks/usePondData';
import { Loader2 } from 'lucide-react';
import Dashboard from './Dashboard';
import PondSelection from './PondSelection';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { ponds, isLoading: pondsLoading } = usePondData();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || pondsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your ponds...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // If user has only one pond, go directly to dashboard
  if (ponds.length === 1) {
    return <Dashboard />;
  }

  // If user has multiple ponds or no ponds, show pond selection
  return <PondSelection />;
}
