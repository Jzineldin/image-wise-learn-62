import { Crown, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FounderBadgeProps {
  founderStatus?: string | null;
  isBetaUser?: boolean;
  betaJoinedAt?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const FounderBadge = ({
  founderStatus,
  isBetaUser,
  betaJoinedAt,
  size = 'md',
  showLabel = false,
  className = '',
}: FounderBadgeProps) => {
  // Don't show badge if not a beta user or founder
  if (!isBetaUser && !founderStatus) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const badgeConfig = {
    founder: {
      icon: Crown,
      label: 'Founder',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      description: 'Beta Founder - Joined during the initial launch',
      gradient: 'from-yellow-400 to-amber-600',
    },
    early_adopter: {
      icon: Sparkles,
      label: 'Early Adopter',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      description: 'Early Adopter - One of the first users',
      gradient: 'from-blue-400 to-indigo-600',
    },
  };

  const config = founderStatus && founderStatus in badgeConfig
    ? badgeConfig[founderStatus as keyof typeof badgeConfig]
    : badgeConfig.founder; // Default to founder if beta user

  const Icon = config.icon;

  const badge = (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${config.bgColor} ${config.borderColor} ${className}`}
    >
      <Icon className={`${sizeClasses[size]} ${config.color} animate-pulse`} />
      {showLabel && (
        <span className={`text-xs font-semibold ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <Icon className="w-4 h-4" />
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
            {betaJoinedAt && (
              <p className="text-xs text-muted-foreground">
                Joined: {new Date(betaJoinedAt).toLocaleDateString()}
              </p>
            )}
            <p className="text-xs font-medium text-primary mt-2">
              🎉 Thank you for being an early supporter!
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FounderBadge;

