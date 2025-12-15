import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Image with overlay */}
      <div 
        className="hidden lg:block relative bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1760822402889-1317a4eb43c7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxleHBvJTIwY3Jvd2QlMjBidXN5fGVufDB8fHx8MTc2NTgzNDA2NHww&ixlib=rb-4.1.0&q=85')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/80"></div>
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-secondary-foreground bg-clip-text text-transparent">
            Conference Management
          </h1>
          <p className="text-xl text-white/90">
            Streamline your events, engage your audience, deliver exceptional experiences.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" data-testid="login-email-label">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email-input"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" data-testid="login-password-label">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password-input"
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Demo: admin@demo.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
