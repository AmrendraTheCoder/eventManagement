"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Loader2 } from "lucide-react";

type TestParticipantsButtonProps = {
  eventId: string;
};

export default function TestParticipantsButton({
  eventId,
}: TestParticipantsButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const createTestParticipants = async () => {
    setIsCreating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/create-test-participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          count: 5, // Create 5 test participants
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create test participants");
      }

      setMessage(`✅ ${data.message}`);

      // Refresh the page to show updated participant counts
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error creating test participants:", error);
      setMessage(
        `❌ ${error instanceof Error ? error.message : "Failed to create test participants"}`
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={createTestParticipants}
        disabled={isCreating}
        className="w-full"
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Test Participants...
          </>
        ) : (
          <>
            <Users className="mr-2 h-4 w-4" />
            Create 5 Test Participants
          </>
        )}
      </Button>

      {message && (
        <div className="text-xs text-center p-2 rounded bg-gray-50">
          {message}
        </div>
      )}
    </div>
  );
}
