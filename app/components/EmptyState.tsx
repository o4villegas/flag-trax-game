import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode | LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = "" 
}: EmptyStateProps) {
  const IconComponent = typeof icon === 'function' ? icon : null;
  
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {icon && (
          <div className="mb-4">
            {IconComponent ? (
              <IconComponent className="h-12 w-12 text-muted-foreground" />
            ) : (
              <span className="text-6xl opacity-50">{icon}</span>
            )}
          </div>
        )}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
        {action && (
          <Button 
            onClick={action.onClick} 
            variant={action.variant || "default"}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
