import { Navigation } from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showNav?: boolean;
  className?: string;
}

export function Layout({ 
  children, 
  maxWidth = "2xl", 
  showNav = true,
  className = ""
}: LayoutProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-6xl",
  }[maxWidth];

  return (
    <div className="min-h-screen flex flex-col">
      {showNav && <Navigation />}
      <main className={`flex-1 container mx-auto px-4 py-8 ${maxWidthClass} ${className}`}>
        {children}
      </main>
    </div>
  );
}
