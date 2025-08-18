"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/ui/SignoutButton";
import ImageUpload from "@/components/ImageUpload";

interface UserData {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  recoveryEmail: string | null;
  onboardingComplete: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/");
    }

    if (status === "authenticated" && session?.user) {
      // Check if user has completed onboarding
      if (!session.user.onboardingComplete) {
        redirect("/onboarding");
      }

      // Set initial image from session
      setCurrentImage(session.user.image || null);
      
      // Fetch additional user data
      fetchUserData();
    }
  }, [session, status]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/recovery-email');
      const data = await response.json();
      
      if (data.success) {
        setUserData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpdate = async (newImageUrl: string) => {
    // Update local state immediately
    setCurrentImage(newImageUrl);
    
    // Update session to reflect the new image
    await update({
      ...session,
      user: {
        ...session?.user,
        image: newImageUrl,
      },
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session?.user || !userData) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="bg-white dark:bg-black rounded-2xl shadow-lg p-8 max-w-md w-full border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">
          User Profile
        </h1>

        {/* Profile Image Upload Section */}
        <div className="mb-6">
          <ImageUpload
            currentImage={currentImage}
            onImageUpdate={handleImageUpdate}
            className="w-full"
          />
        </div>

        {/* User Information */}
        <div className="space-y-3 text-black dark:text-white">
          <div>
            <strong>Name:</strong> {session.user.name || "Not provided"}
          </div>
          
          <div>
            <strong>Username:</strong> {session.user.username}
          </div>
          
          {session.user.email && (
            <div>
              <strong>Primary Email:</strong> {session.user.email}
            </div>
          )}
          
          {userData.recoveryEmail && (
            <div>
              <strong>Recovery Email:</strong> {userData.recoveryEmail}
            </div>
          )}
          
          {session.user.groups && session.user.groups.length > 0 && (
            <div>
              <strong>Groups:</strong>{" "}
              {session.user.groups
                .map((group) => {
                  const match = group.match(/^CN=([^,]+)/);
                  return match ? match[1] : group;
                })
                .slice(0, 3) // Show only first 3 groups
                .join(", ")}
              {session.user.groups.length > 3 && (
                <span className="text-gray-500"> (+{session.user.groups.length - 3} more)</span>
              )}
            </div>
          )}

          <div className="pt-2 text-sm text-gray-600 dark:text-gray-400">
            <div><strong>Member Since:</strong> {formatDate(userData.createdAt)}</div>
            <div><strong>Last Login:</strong> {formatDate(userData.lastLoginAt)}</div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-3">
            <a 
              href="/change-password" 
              className="block w-full text-center bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition-colors font-medium"
            >
              Change Password
            </a>
            
            <a 
              href="/recovery-email" 
              className="block w-full text-center bg-gray-600 text-white rounded-lg p-3 hover:bg-gray-700 transition-colors font-medium"
            >
              Update Recovery Email
            </a>
            
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}