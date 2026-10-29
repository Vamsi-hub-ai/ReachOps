import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="flex items-center justify-center min-h-screen bg-black text-slate-100 p-4">
      <Card className="w-full max-w-md bg-[#0e0f17] border border-[#202235] shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">Create an account</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-[#FF7171] font-medium text-center">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                className="bg-[#141520] border-[#26283b] text-white placeholder-slate-500 focus:border-[#9FA0FF]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
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
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                className="bg-[#141520] border-[#26283b] text-white placeholder-slate-500 focus:border-[#9FA0FF]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0c0d18] font-bold shadow-md shadow-[#9FA0FF]/25 border-none" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
            <div className="text-sm text-center text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-[#9FA0FF] font-semibold hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
