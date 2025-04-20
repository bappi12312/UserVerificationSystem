import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyEmail } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Get token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
          setVerificationStatus('error');
          setErrorMessage('No verification token provided');
          return;
        }

        // Call API to verify email
        await verifyEmail(token);
        setVerificationStatus('success');
      } catch (error) {
        setVerificationStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to verify email');
        
        toast({
          title: "Verification Failed",
          description: error instanceof Error ? error.message : 'Failed to verify email',
          variant: "destructive",
        });
      }
    };

    verifyToken();
  }, [toast]);

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {verificationStatus === 'loading' && (
            <>
              <RefreshCw className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              <CardDescription>Verifying your email address...</CardDescription>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Verification Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your email has been verified successfully. You can now log in to your account.
              </p>
              <Button onClick={() => navigate('/')}>
                Continue to Login
              </Button>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">
                {errorMessage || 'We could not verify your email address. The link may have expired or is invalid.'}
              </p>
              <Button onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
