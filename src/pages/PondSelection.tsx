import { useNavigate } from 'react-router-dom';
import { usePondData } from '@/hooks/usePondData';
import { Header } from '@/components/Header';
import { PondCard } from '@/components/PondCard';
import { AddPondDialog } from '@/components/AddPondDialog';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function PondSelection() {
  const navigate = useNavigate();
  const { ponds, isLoading, refetch } = usePondData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header alertCount={0} />
      
      <main className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Ponds</h2>
            <p className="text-muted-foreground mt-1">
              Select a pond to view monitoring dashboard
            </p>
          </div>
          <AddPondDialog onSuccess={() => refetch()} />
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
            <h3 className="font-semibold text-lg text-foreground mb-2">No Ponds Yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Add your first pond to start monitoring.
            </p>
            <AddPondDialog onSuccess={() => refetch()} />
          </div>
        )}
      </main>
    </div>
  );
}
