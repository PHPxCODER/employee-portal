"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SigninPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4 transition-colors duration-300">
      <Card className="w-full max-w-md shadow-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-black dark:text-white transition-colors duration-300">
            Hextasphere EPMS
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300 transition-colors duration-300">
            Enter your LDAP username and password to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <Label htmlFor="username" className="text-black dark:text-white transition-colors duration-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white dark:bg-black text-black dark:text-white border-gray-300 dark:border-gray-600 transition-colors duration-300"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-black dark:text-white transition-colors duration-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white dark:bg-black text-black dark:text-white border-gray-300 dark:border-gray-600 transition-colors duration-300"
              />
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
