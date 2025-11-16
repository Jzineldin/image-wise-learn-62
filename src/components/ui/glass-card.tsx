import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Reusable glass morphism card component
 * Provides consistent cinematic styling across the application
 */
export function GlassCard({
  children,
  className = "",
  hover = true,
  padding = "md"
}: GlassCardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  return (
    <div
      className={cn(
        // Base glass morphism styling
        "rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md",
        "ring-1 ring-[rgba(242,181,68,.18)]",
        "shadow-[0_12px_48px_rgba(0,0,0,.45)]",

        // Hover effects (optional)
        hover && "hover:ring-[rgba(242,181,68,.35)] hover:shadow-[0_12px_48px_rgba(242,181,68,.15)] transition-all duration-300",

        // Padding
        paddingClasses[padding],

        // Custom className
        className
      )}
    >
      {children}
    </div>
  );
}
