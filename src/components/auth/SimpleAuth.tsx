import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Mail, User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import googleIcon from "@/assets/google-icon.png";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface SimpleAuthProps {
  onBack?: () => void;
  onSuccess: (role: 'customer' | 'provider') => void;
}

const SimpleAuth = ({ onBack, onSuccess }: SimpleAuthProps) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    location: ''
  });

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email }
      });
      
      if (error) {
        console.error('Email check error:', error);
        return false;
      }
      
      return data?.exists || false;
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if email exists before sending reset link
      setCheckingEmail(true);
      const emailExists = await checkEmailExists(formData.email);
      setCheckingEmail(false);

      if (!emailExists) {
        toast({
          title: "Email Not Found",
          description: "This email does not have an account. Create one first.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/confirm?type=recovery`
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for the password reset link."
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setCheckingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
      setGoogleLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sendWelcomeEmail = async (email: string, fullName: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-confirmation-email', {
        body: { email, fullName }
      });
      
      if (error) {
        console.error('Welcome email error:', error);
      } else {
        console.log('Welcome email sent successfully');
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate required fields
        if (!formData.email || !formData.password || !formData.fullName || !formData.location) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Validate password length
        if (formData.password.length < 6) {
          toast({
            title: "Weak Password",
            description: "Password must be at least 6 characters long.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Check if email already exists BEFORE attempting signup
        setCheckingEmail(true);
        const emailExists = await checkEmailExists(formData.email);
        setCheckingEmail(false);

        if (emailExists) {
          toast({
            title: "Email Already Exists",
            description: "This email is already registered. Please try a new one or log in instead.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Sign up new user (no email verification required)
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              full_name: formData.fullName,
              location: formData.location,
              role: 'customer'
            }
          }
        });

        if (error) {
          if (error.message.includes('already') || error.message.includes('User already registered') || error.status === 422) {
            toast({
              title: "Email Already Exists",
              description: "This email is already registered in our database. Please try with a different one or log in instead.",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
          throw error;
        }

        // Send welcome email
        await sendWelcomeEmail(formData.email, formData.fullName);

        toast({
          title: "Account Created!",
          description: "Your account has been successfully created. Welcome!",
        });
        
        onSuccess('customer');

      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid Credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Welcome Back!",
          description: "You have successfully signed in.",
        });
        
        onSuccess('customer');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) throw error;

      // Also send welcome email
      await sendWelcomeEmail(formData.email, formData.fullName);

      toast({
        title: "Email Resent",
        description: "We've sent another confirmation email to your inbox.",
      });
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error.message || "Failed to resend email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            {resetEmailSent ? 'Check Your Email' : showForgotPassword ? 'Reset Password' : emailSent ? 'Check Your Email' : (isSignUp ? 'Create Account' : 'Welcome Back')}
          </CardTitle>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {resetEmailSent ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Password Reset Email Sent</h3>
              <p className="text-muted-foreground">
                We've sent a password reset link to <strong>{formData.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox (and spam folder) and click the link to reset your password.
              </p>
            </div>

            <Button
              onClick={() => {
                setResetEmailSent(false);
                setShowForgotPassword(false);
              }}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        ) : showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-muted-foreground text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading || checkingEmail} className="w-full">
              {checkingEmail ? "Checking email..." : loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForgotPassword(false)}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </form>
        ) : emailSent ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Confirmation Email Sent</h3>
              <p className="text-muted-foreground">
                We've sent a confirmation link to <strong>{formData.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox (and spam folder) and click the link to activate your account.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Sending..." : "Resend Email"}
              </Button>
              
              <Button
                onClick={() => setEmailSent(false)}
                variant="ghost"
                className="w-full"
              >
                Change Email Address
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pr-10"
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
              {isSignUp && <PasswordStrengthIndicator password={formData.password} />}
            </div>

            {/* Additional fields for sign up */}
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      type="text"
                      placeholder="Enter your city/location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading || checkingEmail} className="w-full">
              {checkingEmail ? "Checking email..." : loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3"
            >
              <img src={googleIcon} alt="Google" className="w-5 h-5" />
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline font-medium"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleAuth;