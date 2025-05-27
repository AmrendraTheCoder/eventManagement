"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminButton() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateToAdmin = async () => {
    setIsUpdating(true);

    try {
      const response = await fetch("/api/update-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      toast({
        title: "Success!",
        description: "Your role has been updated to admin.",
      });

      // Refresh the page to show updated role
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={updateToAdmin}
      disabled={isUpdating}
      className="w-full"
    >
      {isUpdating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating Role...
        </>
      ) : (
        <>
          <Shield className="mr-2 h-4 w-4" />
          Make Me Admin
        </>
      )}
    </Button>
  );
}
