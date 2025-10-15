import { useState } from "react";
import { useNavigate } from "react-router";
import { signIn } from "../lib/auth.client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, User, AlertTriangle } from "lucide-react";

const TEST_ACCOUNTS = [
  { 
    email: "admin@test.com", 
    name: "Admin User", 
    password: "Test123!",
    role: "Admin",
    description: "Full admin access"
  },
  { 
    email: "player1@test.com", 
    name: "Player One", 
    password: "Test123!",
    role: "Player",
    description: "Has flag #1"
  },
  { 
    email: "player2@test.com", 
    name: "Player Two", 
    password: "Test123!",
    role: "Player",
    description: "Has flag #2"
  }
];

export default function DevSignIn() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleQuickLogin = async (account: typeof TEST_ACCOUNTS[0]) => {
    setIsLoading(account.email);
    try {
      await signIn.email({
        email: account.email,
        password: account.password
      }, {
        onSuccess: () => {
          toast.success(`Logged in as ${account.name}`);
          navigate("/");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Login failed");
        }
      });
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Layout showNav={false} maxWidth="md">
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="w-full border-2 border-yellow-500 bg-yellow-50/50">
          <CardHeader className="bg-yellow-100 border-b border-yellow-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle>Development Sign-In</CardTitle>
            </div>
            <CardDescription className="text-yellow-700">
              Quick login with test accounts (Password: Test123!)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <strong>Note:</strong> Use regular <a href="/sign-up" className="underline">sign-up</a> to create these accounts first
            </div>
            
            {TEST_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                onClick={() => handleQuickLogin(account)}
                disabled={isLoading !== null}
                variant="outline"
                className="w-full h-auto p-3 justify-start text-left hover:bg-yellow-50"
              >
                {isLoading === account.email ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <User className="mr-2 h-4 w-4" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{account.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                      {account.role}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {account.email} • {account.description}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
