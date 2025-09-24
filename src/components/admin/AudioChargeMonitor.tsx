import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface AudioCharge {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
  metadata: any;
}

interface DuplicateGroup {
  userId: string;
  text: string;
  charges: AudioCharge[];
  totalAmount: number;
  duplicateAmount: number;
}

export const AudioChargeMonitor = () => {
  const [charges, setCharges] = useState<AudioCharge[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAudioCharges = async () => {
    setLoading(true);
    try {
      // Get audio generation transactions from the last 7 days
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('type', 'audioGeneration')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setCharges(data || []);
      analyzeDuplicates(data || []);
    } catch (error) {
      logger.error('Error loading audio charges', error, {
        component: 'AudioChargeMonitor',
        operation: 'loadAudioCharges'
      });
      toast({
        title: "Error",
        description: "Failed to load audio charges",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeDuplicates = (chargeData: AudioCharge[]) => {
    const groupedByUserAndText = new Map<string, AudioCharge[]>();

    chargeData.forEach(charge => {
      if (charge.metadata?.text) {
        const key = `${charge.user_id}-${charge.metadata.text.substring(0, 100)}`;
        if (!groupedByUserAndText.has(key)) {
          groupedByUserAndText.set(key, []);
        }
        groupedByUserAndText.get(key)!.push(charge);
      }
    });

    const potentialDuplicates: DuplicateGroup[] = [];
    
    groupedByUserAndText.forEach((charges, key) => {
      if (charges.length > 1) {
        const totalAmount = charges.reduce((sum, c) => sum + Math.abs(c.amount), 0);
        const duplicateAmount = totalAmount - Math.abs(charges[0].amount);
        
        potentialDuplicates.push({
          userId: charges[0].user_id,
          text: charges[0].metadata.text.substring(0, 50) + '...',
          charges,
          totalAmount,
          duplicateAmount
        });
      }
    });

    // Sort by duplicate amount descending
    potentialDuplicates.sort((a, b) => b.duplicateAmount - a.duplicateAmount);
    setDuplicates(potentialDuplicates);
  };

  useEffect(() => {
    loadAudioCharges();
  }, []);

  const totalDuplicateCredits = duplicates.reduce((sum, group) => sum + group.duplicateAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">Audio Charge Monitor</h2>
        <Button onClick={loadAudioCharges} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{charges.length}</div>
            <div className="text-sm text-text-secondary">Total Audio Charges (7d)</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{duplicates.length}</div>
            <div className="text-sm text-text-secondary">Potential Duplicate Groups</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{totalDuplicateCredits}</div>
            <div className="text-sm text-text-secondary">Potential Refund Credits</div>
          </div>
        </Card>
      </div>

      {/* Duplicate Groups */}
      {duplicates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
            Potential Duplicate Charges
          </h3>
          
          {duplicates.slice(0, 10).map((group, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">User: {group.userId}</div>
                    <div className="text-sm text-text-secondary">Text: {group.text}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-destructive">
                      -{group.duplicateAmount} credits
                    </div>
                    <div className="text-sm text-text-secondary">
                      {group.charges.length} charges
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-text-secondary">
                  Charges: {group.charges.map(c => 
                    new Date(c.created_at).toLocaleTimeString()
                  ).join(', ')}
                </div>
              </div>
            </Card>
          ))}
          
          {duplicates.length > 10 && (
            <div className="text-center text-text-secondary">
              And {duplicates.length - 10} more duplicate groups...
            </div>
          )}
        </div>
      )}

      {duplicates.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-text-secondary">
            No duplicate audio charges detected in the last 7 days.
          </div>
        </Card>
      )}
    </div>
  );
};