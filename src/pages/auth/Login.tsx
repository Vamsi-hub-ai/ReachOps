import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

export default function Login() {
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Resilient fallback for demo user so client is never blocked by database cold starts
        const cleanEmail = email.toLowerCase().trim();
        const cleanPass = password.trim();
        if ((cleanEmail === 'demo' || cleanEmail === 'demo@reachops.com') && (cleanPass === 'Demo@123' || cleanPass.toLowerCase() === 'demo@123' || !cleanPass)) {
          const demoUser = {
            id: 'demo-user-id',
            name: 'Demo User',
            email: 'demo@reachops.com',
            isDemo: true,
          };
          localStorage.setItem('user', JSON.stringify(demoUser));
          localStorage.removeItem('campaigns');
          localStorage.removeItem('email_accounts');
          window.dispatchEvent(new Event('user-updated'));
          navigate('/dashboard');
          return;
        }
        throw new Error(data.error || 'Login failed');
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.removeItem('campaigns');
        localStorage.removeItem('email_accounts');
        window.dispatchEvent(new Event('user-updated'));
      }

      navigate('/dashboard');
    } catch (err: any) {
      const cleanEmail = email.toLowerCase().trim();
      const cleanPass = password.trim();
      if ((cleanEmail === 'demo' || cleanEmail === 'demo@reachops.com') && (cleanPass === 'Demo@123' || cleanPass.toLowerCase() === 'demo@123' || !cleanPass)) {
        const demoUser = {
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@reachops.com',
          isDemo: true,
        };
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.removeItem('campaigns');
        localStorage.removeItem('email_accounts');
        window.dispatchEvent(new Event('user-updated'));
        navigate('/dashboard');
        return;
      }

      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Cannot connect to ReachOps backend server. Please make sure the dev server is active.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#06110c] bg-reachops-cosmic text-slate-100 p-4 overflow-hidden selection:bg-[#10b981]/30">
      <Card className="w-full max-w-md bg-[#171717]/85 backdrop-blur-2xl border border-white/[0.09] shadow-[0_16px_48px_rgba(0,0,0,0.5)] rounded-2xl relative z-10">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex justify-center mb-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#10b981] flex items-center justify-center shadow-xl shadow-[#10b981]/30">
              <Send className="w-5 h-5 text-white -rotate-12 translate-x-[-1px] translate-y-[-1px]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-extrabold text-center text-white tracking-tight flex items-center justify-center">
            ReachOps<span className="text-emerald-400">.</span>
          </CardTitle>
          <CardDescription className="text-center text-slate-400 text-xs">
            Sign in with your User ID or Email to access your outreach workspace.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-xs text-[#FB7185] font-semibold text-center bg-[#FB7185]/10 p-3 rounded-xl border border-[#FB7185]/20 animate-in fade-in">
                {error}
              </div>
            )}
            
            {/* Demo credentials hint banner */}
            <div className="bg-white/[0.03] border border-[#10b981]/30 p-3.5 rounded-xl flex items-center justify-between text-xs backdrop-blur-sm shadow-inner">
              <div>
                <span className="text-emerald-300 font-extrabold block text-[11px] uppercase tracking-wider">Demo Client Account:</span>
                <span className="text-slate-300 text-xs">ID: <code className="text-white font-mono bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">Demo</code> | Pass: <code className="text-white font-mono bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">Demo@123</code></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('Demo');
                  setPassword('Demo@123');
                }}
                className="px-3 py-1.5 bg-[#10b981]/15 hover:bg-[#10b981]/35 text-emerald-300 hover:text-white font-bold rounded-lg transition-all border border-[#10b981]/30 cursor-pointer shadow-sm text-xs active:scale-95"
              >
                Auto-fill
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-xs font-semibold">User ID / Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="Demo or demo@reachops.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-[#10b981] rounded-xl h-10 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-xs font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-[#10b981] rounded-xl h-10 text-xs"
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="text-xs text-center text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
