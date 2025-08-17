"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/");
    }
  }, [status]);

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Don't render if no session
  if (!session?.user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters long" });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: session.user.username, // Get from session
          oldPassword, 
          newPassword 
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message || "Password changed successfully" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to change password" });
      }
    } catch (error) {
      console.error("Password change error:", error);
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-black dark:text-white">
            Change Password
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Logged in as: <span className="font-medium">{session.user.name}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <Label htmlFor="oldPassword" className="text-black dark:text-white">
                Current Password
              </Label>
              <Input
                id="oldPassword"
                type="password"
                placeholder="Enter your current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="bg-white dark:bg-black text-black dark:text-white border-gray-300 dark:border-gray-600"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="newPassword" className="text-black dark:text-white">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white dark:bg-black text-black dark:text-white border-gray-300 dark:border-gray-600"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-black dark:text-white">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white dark:bg-black text-black dark:text-white border-gray-300 dark:border-gray-600"
                required
                minLength={8}
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Changing Password..." : "Change Password"}
            </Button>

            <div className="text-center">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="text-sm"
              >
                ← Back to Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}