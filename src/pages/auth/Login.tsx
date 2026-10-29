import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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

      const data = await response.json();

      if (!response.ok) {
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
    <div className="flex items-center justify-center min-h-screen bg-black text-slate-100 p-4">
      <Card className="w-full max-w-md bg-[#0e0f17] border border-[#202235] shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">Login</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Sign in with your User ID or Email to access the platform.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-[#FF7171] font-medium text-center bg-[#FF7171]/10 p-2.5 rounded-lg border border-[#FF7171]/20">{error}</div>}
            
            {/* Demo credentials hint banner */}
            <div className="bg-[#141520] border border-[#9FA0FF]/30 p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[#9FA0FF] font-bold block">Demo Client Account:</span>
                <span className="text-slate-300">ID: <code className="text-white font-mono bg-[#0c0d16] px-1 py-0.5 rounded">Demo</code> | Pass: <code className="text-white font-mono bg-[#0c0d16] px-1 py-0.5 rounded">Demo@123</code></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('Demo');
                  setPassword('Demo@123');
                }}
                className="px-2.5 py-1.5 bg-[#9FA0FF]/20 hover:bg-[#9FA0FF]/30 text-[#9FA0FF] font-semibold rounded-lg transition-colors border border-[#9FA0FF]/40 cursor-pointer"
              >
                Auto-fill
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">User ID / Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="Demo or demo@reachops.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                className="bg-[#141520] border-[#26283b] text-white placeholder-slate-500 focus:border-[#9FA0FF]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                className="bg-[#141520] border-[#26283b] text-white placeholder-slate-500 focus:border-[#9FA0FF]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0c0d18] font-bold shadow-md shadow-[#9FA0FF]/25 border-none" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="text-sm text-center text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#9FA0FF] font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
