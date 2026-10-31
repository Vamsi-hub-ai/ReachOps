import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#06110c] bg-reachops-cosmic text-slate-100 p-4 overflow-hidden selection:bg-[#8B5CF6]/30">
      <Card className="w-full max-w-md bg-[#171717]/85 backdrop-blur-2xl border border-white/[0.09] shadow-[0_16px_48px_rgba(0,0,0,0.5)] rounded-2xl relative z-10">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex justify-center mb-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-xl shadow-[#6366F1]/30">
              <Send className="w-5 h-5 text-white -rotate-12 translate-x-[-1px] translate-y-[-1px]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-extrabold text-center text-white tracking-tight flex items-center justify-center">
            Create an account<span className="text-emerald-400">.</span>
          </CardTitle>
          <CardDescription className="text-center text-slate-400 text-xs">
            Start scaling high-deliverability outreach with ReachOps today.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-xs text-[#FB7185] font-semibold text-center bg-[#FB7185]/10 p-3 rounded-xl border border-[#FB7185]/20 animate-in fade-in">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-slate-300 text-xs font-semibold">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-[#8B5CF6] rounded-xl h-10 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-xs font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-[#8B5CF6] rounded-xl h-10 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-xs font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-[#8B5CF6] rounded-xl h-10 text-xs"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button 
              type="submit" 
              className="w-full btn-reachops-primary font-bold h-10 rounded-xl transition-all shadow-lg shadow-[#a31c1b]/25 active:scale-95 text-xs cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
            <div className="text-xs text-center text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
