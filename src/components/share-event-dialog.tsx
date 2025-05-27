"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Share2, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ShareEventDialogProps = {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ShareEventDialog({
  eventId,
  eventTitle,
  open,
  onOpenChange,
}: ShareEventDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/events/${eventId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Event link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const text = `Check out this event: ${eventTitle}\n${eventUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareViaEmail = () => {
    const subject = `Invitation: ${eventTitle}`;
    const body = `I'd like to invite you to this event:\n\n${eventTitle}\n\nRegister here: ${eventUrl}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: `Check out this event: ${eventTitle}`,
          url: eventUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Event</DialogTitle>
          <DialogDescription>
            Share this event link with participants
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link">Event Link</Label>
            <div className="flex items-center space-x-2">
              <Input id="link" value={eventUrl} readOnly className="flex-1" />
              <Button
                type="button"
                size="sm"
                onClick={copyToClipboard}
                className="px-3"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Share via</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaWhatsApp}
                className="flex flex-col items-center py-4"
              >
                <MessageCircle className="h-5 w-5 mb-1" />
                <span className="text-xs">WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={shareViaEmail}
                className="flex flex-col items-center py-4"
              >
                <Mail className="h-5 w-5 mb-1" />
                <span className="text-xs">Email</span>
              </Button>

              {typeof navigator.share === "function" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareNative}
                  className="flex flex-col items-center py-4"
                >
                  <Share2 className="h-5 w-5 mb-1" />
                  <span className="text-xs">More</span>
                </Button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Tip: Share this link with participants so they can register and
              make payments for your event.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
