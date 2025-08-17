"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, Shield, User } from "lucide-react";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    // If user has already completed onboarding, redirect to profile
    if (session?.user?.onboardingComplete) {
      router.push("/profile");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Client-side validation
    if (!recoveryEmail.trim()) {
      setMessage({ type: "error", text: "Recovery email is required" });
      setLoading(false);
      return;
    }

    if (!validateEmail(recoveryEmail)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      setLoading(false);
      return;
    }

    if (recoveryEmail !== confirmEmail) {
      setMessage({ type: "error", text: "Email addresses do not match" });
      setLoading(false);
      return;
    }

    // Check if recovery email is the same as primary email
    if (session.user.email && recoveryEmail.toLowerCase() === session.user.email.toLowerCase()) {
      setMessage({ 
        type: "error", 
        text: "Recovery email must be different from your primary email address" 
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/recovery-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryEmail }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Recovery email set successfully! Redirecting..." });
        
        // Update the session to reflect the changes
        await update({
          ...session,
          user: {
            ...session.user,
            recoveryEmail,
            onboardingComplete: true,
          },
        });

        // Redirect to profile after a short delay
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to set recovery email" });
      }
    } catch (error) {
      console.error("Recovery email setup error:", error);
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to the Portal!</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Complete your setup to secure your account
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">{session.user.name}</p>
              <p className="text-sm text-gray-500">{session.user.username}</p>
              {session.user.email && (
                <p className="text-sm text-gray-500">{session.user.email}</p>
              )}
            </div>
          </div>

          {/* Recovery Email Form */}
          <div className="space-y-4">
            <div className="text-center">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold">Set Recovery Email</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This email will be used for password recovery and important security notifications.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                  <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label htmlFor="recoveryEmail">Recovery Email Address</Label>
                <Input
                  id="recoveryEmail"
                  type="email"
                  placeholder="Enter your recovery email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmEmail">Confirm Recovery Email</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  placeholder="Confirm your recovery email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </div>

          {/* Sign Out Option */}
          <div className="text-center pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="text-sm"
            >
              Sign out instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}