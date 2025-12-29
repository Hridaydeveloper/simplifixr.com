
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be less than 72 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'recovery'>('loading');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate with zod
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const errors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'password') errors.password = err.message;
        if (err.path[0] === 'confirmPassword') errors.confirmPassword = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setStatus('success');
      setMessage('Your password has been updated successfully!');
      toast({
        title: "Password Updated",
        description: "You can now sign in with your new password.",
      });

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get all possible URL parameters that Supabase might send
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        
        console.log('Auth confirm params:', { token_hash, type, access_token, refresh_token });

        // Check if this is a password recovery flow
        const isRecovery = type === 'recovery';

        let confirmationResult = null;

        if (token_hash && type) {
          // New format - use verifyOtp
          console.log('Using new format verification with token_hash');
          confirmationResult = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
        } else if (access_token && refresh_token) {
          // Old format - set session directly
          console.log('Using old format verification with access and refresh tokens');
          confirmationResult = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
        } else {
          // Try to handle URL fragments (sometimes tokens come after #)
          const fragment = window.location.hash.substring(1);
          const fragmentParams = new URLSearchParams(fragment);
          const fragmentAccessToken = fragmentParams.get('access_token');
          const fragmentRefreshToken = fragmentParams.get('refresh_token');
          const fragmentType = fragmentParams.get('type');
          
          if (fragmentAccessToken && fragmentRefreshToken) {
            console.log('Using URL fragment tokens');
            confirmationResult = await supabase.auth.setSession({
              access_token: fragmentAccessToken,
              refresh_token: fragmentRefreshToken,
            });
            
            // Check if recovery flow from fragment
            if (fragmentType === 'recovery') {
              setStatus('recovery');
              setMessage('Please enter your new password below.');
              return;
            }
          } else {
            // Check if user is already logged in - this might be a valid link but user is already confirmed
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (user) {
              console.log('User already logged in, treating as successful confirmation');
              setStatus('success');
              setMessage('Your email has been confirmed successfully!');
              
              toast({
                title: "Email Confirmed",
                description: "Your account has been verified successfully!",
              });

              setTimeout(() => {
                navigate('/', { replace: true });
              }, 1000);
              return;
            }
            
            console.log('No valid confirmation parameters found');
            setStatus('error');
            setMessage('Invalid confirmation link. Please check your email for the correct link or try signing up again.');
            return;
          }
        }

        const { data, error } = confirmationResult;

        if (error) {
          console.error('Email confirmation error:', error);
          
          // Handle specific error cases
          if (error.message.includes('expired')) {
            setStatus('error');
            setMessage('The confirmation link has expired. Please sign up again to receive a new link.');
          } else if (error.message.includes('invalid')) {
            setStatus('error');
            setMessage('Invalid confirmation link. Please check your email for the correct link or sign up again.');
          } else {
            setStatus('error');
            setMessage('Failed to confirm email. Please try again or contact support.');
          }
          return;
        }

        if (data.user) {
          console.log('Email confirmed successfully for user:', data.user.email);
          
          // If this is a recovery flow, show password update form
          if (isRecovery) {
            setStatus('recovery');
            setMessage('Please enter your new password below.');
            return;
          }
          
          // The AuthContext will handle profile creation via onAuthStateChange
          setStatus('success');
          setMessage('Your email has been confirmed successfully!');
          
          toast({
            title: "Email Confirmed",
            description: "Your account has been verified successfully!",
          });

          // Redirect to home page immediately after success
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1000);
        } else {
          setStatus('error');
          setMessage('Confirmation failed. Please try again.');
        }
      } catch (error: any) {
        console.error('Unexpected error during email confirmation:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try signing up again.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Confirming your email...</h1>
              <p className="text-muted-foreground">Please wait while we verify your account.</p>
            </>
          )}

          {status === 'recovery' && (
            <>
              <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Reset Your Password</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              <form onSubmit={handlePasswordUpdate} className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-sm text-destructive">{validationErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pr-10 ${validationErrors.confirmPassword ? 'border-destructive' : ''}`}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" disabled={updating} className="w-full">
                  {updating ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {message.includes('password') ? 'Password Updated!' : 'Email Confirmed!'}
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting you now...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Confirmation Failed</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Sign Up Again
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Homepage
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthConfirm;
