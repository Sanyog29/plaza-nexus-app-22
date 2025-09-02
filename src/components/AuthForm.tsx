import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface AuthFormProps {
  onSignIn: (identifier: string, password: string, isSignUp?: boolean) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSignUpMode: boolean;
  setIsSignUpMode: (mode: boolean) => void;
  emailSent: boolean;
}

export function AuthForm({ 
  onSignIn, 
  isLoading, 
  error, 
  isSignUpMode, 
  setIsSignUpMode, 
  emailSent 
}: AuthFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierType, setIdentifierType] = useState<'email' | 'mobile'>('email');

  const validateIdentifier = (value: string) => {
    if (identifierType === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    } else {
      return /^\+?[\d\s\-()]+$/.test(value) && value.replace(/\D/g, '').length >= 10;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !password) return;
    
    if (!validateIdentifier(identifier)) {
      return;
    }

    if (isSignUpMode && password !== confirmPassword) {
      return;
    }

    await onSignIn(identifier, password, isSignUpMode);
  };

  const getIdentifierPlaceholder = () => {
    return identifierType === 'email' 
      ? 'Enter your email address'
      : 'Enter your mobile number';
  };

  const getIdentifierLabel = () => {
    return identifierType === 'email' ? 'Email Address' : 'Mobile Number';
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent you a confirmation link. Please check your email and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              If you don't see the email, check your spam folder or try signing up again.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setIsSignUpMode(false)}
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {isSignUpMode ? 'Create Account' : 'Welcome Back'}
        </CardTitle>
        <CardDescription>
          {isSignUpMode 
            ? 'Sign up with your email or mobile number'
            : 'Sign in to your account using email or mobile number'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sign Up Fields */}
          {isSignUpMode && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={isSignUpMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={isSignUpMode}
                />
              </div>
            </div>
          )}

          {/* Identifier Type Selector */}
          <div className="space-y-2">
            <Label>Sign in with</Label>
            <Tabs value={identifierType} onValueChange={(value) => setIdentifierType(value as 'email' | 'mobile')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="mobile" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Mobile
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Identifier Input */}
          <div className="space-y-2">
            <Label htmlFor="identifier">{getIdentifierLabel()}</Label>
            <Input
              id="identifier"
              type={identifierType === 'email' ? 'email' : 'tel'}
              placeholder={getIdentifierPlaceholder()}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className={!validateIdentifier(identifier) && identifier ? 'border-red-500' : ''}
            />
            {identifier && !validateIdentifier(identifier) && (
              <p className="text-sm text-red-500">
                Please enter a valid {identifierType === 'email' ? 'email address' : 'mobile number'}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Confirm Password for Sign Up */}
          {isSignUpMode && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={isSignUpMode}
                className={confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !identifier || !password || (isSignUpMode && password !== confirmPassword)}
          >
            {isLoading ? (
              'Processing...'
            ) : isSignUpMode ? (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>

          {/* Toggle Mode */}
          <div className="text-center space-y-2">
            <Separator />
            <div className="text-sm text-muted-foreground">
              {isSignUpMode ? 'Already have an account?' : "Don't have an account?"}
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSignUpMode(!isSignUpMode)}
              className="w-full"
            >
              {isSignUpMode ? 'Sign In' : 'Sign Up'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}