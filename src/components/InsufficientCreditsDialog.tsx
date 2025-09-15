import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits: number;
  availableCredits: number;
  operation: string;
}

export const InsufficientCreditsDialog: React.FC<InsufficientCreditsDialogProps> = ({
  open,
  onOpenChange,
  requiredCredits,
  availableCredits,
  operation
}) => {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Insufficient Credits
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              You need more credits to {operation}. 
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-1">
                <div className="text-sm font-medium">Credits Required:</div>
                <div className="text-sm font-medium">Credits Available:</div>
                <div className="text-sm font-medium">Credits Needed:</div>
              </div>
              <div className="space-y-1 text-right">
                <Badge variant="destructive" className="flex items-center gap-1 w-fit ml-auto">
                  <Coins className="h-3 w-3" />
                  {requiredCredits}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 w-fit ml-auto">
                  <Coins className="h-3 w-3" />
                  {availableCredits}
                </Badge>
                <Badge variant="default" className="flex items-center gap-1 w-fit ml-auto">
                  <Coins className="h-3 w-3" />
                  {requiredCredits - availableCredits}
                </Badge>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              You can get more credits by upgrading your subscription or purchasing additional credits.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleBuyCredits} className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Get More Credits
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InsufficientCreditsDialog;