import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        {/* Company Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">
            Siwaht CRM
          </h1>
          <p className="text-slate-400 mt-2">AI Service Management Platform</p>
        </div>

        {/* Login Form Card */}
        <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50 shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 bg-slate-800/50 border-slate-700 focus:ring-indigo-500 focus:border-transparent"
                  required
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 bg-slate-800/50 border-slate-700 focus:ring-indigo-500 focus:border-transparent"
                  required
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-[1.02]"
                data-testid="button-submit"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-6 bg-slate-800/20 border-slate-700/30">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 text-center mb-2">Demo Credentials:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-slate-300 font-medium">Admin</p>
                <p className="text-slate-500">admin@siwaht.ai</p>
              </div>
              <div className="text-center">
                <p className="text-slate-300 font-medium">Agent</p>
                <p className="text-slate-500">agent@siwaht.ai</p>
              </div>
              <div className="text-center">
                <p className="text-slate-300 font-medium">Engineer</p>
                <p className="text-slate-500">eng@siwaht.ai</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
