import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePondData } from '@/hooks/usePondData';
import { Header } from '@/components/Header';
import { PondCard } from '@/components/PondCard';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';

export default function PondSelection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { ponds, isLoading } = usePondData(user?.ponds || []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header alertCount={2} />
      
      <main className="p-4 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Your Ponds</h2>
          <p className="text-muted-foreground mt-1">
            Select a pond to view monitoring dashboard
          </p>
        </div>

        <div className="space-y-4 stagger-children">
          {ponds.map((pond) => (
            <PondCard
              key={pond.id}
              pond={pond}
              onClick={() => navigate(`/pond/${pond.id}`)}
            />
          ))}
        </div>

        {ponds.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">No Ponds Found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              No ponds have been assigned to your account yet.
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Request Pond Access
            </Button>
          </div>
        )}

        <div className="mt-8 p-4 rounded-2xl bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">Add New Pond</p>
              <p className="text-xs text-muted-foreground">
                Connect a new IoT device to monitor
              </p>
            </div>
            <Button variant="outline" size="sm">
              Add
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
