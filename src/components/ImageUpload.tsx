"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, Camera, X } from "lucide-react";

interface ImageUploadProps {
  currentImage?: string | null;
  onImageUpdate: (newImageUrl: string) => void;
  className?: string;
}

export default function ImageUpload({ currentImage, onImageUpdate, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Please select a JPEG or PNG image." });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({ type: "error", text: "File size must be less than 5MB." });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        onImageUpdate(data.imageUrl);
        setPreview(null);
      } else {
        setMessage({ type: "error", text: data.error });
        setPreview(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: "error", text: "Upload failed. Please try again." });
      setPreview(null);
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const cancelPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center space-y-4">
        {/* Current/Preview Image */}
        <div className="relative">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-36 h-36 rounded-full object-cover border-4 border-blue-500"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 rounded-full p-1 h-6 w-6"
                onClick={cancelPreview}
                disabled={uploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : currentImage ? (
            <img
              src={currentImage}
              alt="Current profile"
              className="w-36 h-36 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-300 dark:border-gray-600">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileSelect}
            disabled={uploading}
            className="flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Update Profile Picture</span>
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            JPEG or PNG, max 5MB
            <br />
            Recommended: 96x96 pixels
          </p>
        </div>

        {/* Hidden File Input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}