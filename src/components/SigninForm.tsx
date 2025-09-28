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
import { Loader2, Shield, Eye, EyeOff, Lock, User } from "lucide-react";

export default function SigninPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials. Please check your username and password.");
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-black dark:via-gray-900 dark:to-black p-4 transition-all duration-500">      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-gray-800/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 dark:bg-gray-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 dark:bg-gray-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/90 shadow-2xl border-0 ring-1 ring-slate-200/50 dark:ring-gray-800/50 transition-all duration-300 hover:shadow-3xl">          <CardHeader className="text-center space-y-6 pb-8">
          {/* Logo/Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-105">
            <Shield className="w-10 h-10 text-white" />
          </div>
            
            {/* Title and Description */}
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                Sign in to access your <span className="font-semibold text-blue-600 dark:text-blue-400">Hextasphere EPMS</span> account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                  <AlertTitle className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Authentication Failed
                  </AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-12 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign In Button */}
              <Button 
                type="submit" 
                disabled={loading || !username || !password}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Sign In to EPMS
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Secure authentication powered by LDAP
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
