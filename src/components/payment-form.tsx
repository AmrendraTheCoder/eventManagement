"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { Loader2, Copy, Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";

type PricingTier = {
  id: string;
  name: string;
  description: string | null;
  price: number;
};

type PaymentFormProps = {
  eventId: string;
  upiId: string;
  qrCodeUrl: string;
  pricingTiers: PricingTier[];
};

export default function PaymentForm({
  eventId,
  upiId,
  qrCodeUrl,
  pricingTiers,
}: PaymentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    success?: string;
    error?: string;
  } | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    pricingTiers[0]?.id || null
  );
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);

  const generateTestTransactionId = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const testId = `TEST_${timestamp}_${randomStr}`;
    setTransactionId(testId);
    setCopied(true);
    toast({
      title: "Test Transaction ID Generated",
      description: "You can use this ID for testing purposes.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Transaction ID copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  const createTestParticipant = async () => {
    if (!selectedTierId) {
      setMessage({ error: "Please select a pricing tier first" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const selectedTier = pricingTiers.find(
        (tier) => tier.id === selectedTierId
      );
      if (!selectedTier) {
        throw new Error("Selected pricing tier not found");
      }

      // Generate a new test transaction ID if none exists
      if (!transactionId) {
        generateTestTransactionId();
      }

      const payload = {
        eventId,
        pricingTierId: selectedTierId,
        amount: selectedTier.price,
        transactionId: transactionId,
        upiReference: `TEST_REF_${Date.now()}`,
        status: "pending",
      };

      console.log("Creating test participant with payload:", payload);

      const response = await fetch("/api/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.error || "Failed to create test participant");
      }

      setMessage({
        success:
          "Test participant created successfully! Check the manage events page to see the update.",
      });
    } catch (error) {
      console.error("Error creating test participant:", error);
      setMessage({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create test participant",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTierId) {
      setMessage({ error: "Please select a pricing tier" });
      return;
    }

    if (!transactionId) {
      setMessage({ error: "Please enter or generate a transaction ID" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const selectedTier = pricingTiers.find(
        (tier) => tier.id === selectedTierId
      );
      if (!selectedTier) {
        throw new Error("Selected pricing tier not found");
      }

      const payload = {
        eventId,
        pricingTierId: selectedTierId,
        amount: selectedTier.price,
        transactionId: transactionId,
        status: "pending",
      };

      console.log("Submitting payment with payload:", payload);

      const response = await fetch("/api/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.error || "Failed to submit payment");
      }

      setMessage({
        success:
          "Payment submitted successfully! It will be verified by the organizer.",
      });

      // Reset form
      setTransactionId("");

      // Redirect to the event page after a short delay
      setTimeout(() => {
        router.push(`/events/${eventId}/confirmation`);
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Error submitting payment:", error);
      setMessage({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {message && (
        <div className="flex flex-col gap-2 w-full text-sm">
          {message.success && (
            <div className="text-green-500 border-l-2 px-4 bg-green-50 py-2 rounded">
              {message.success}
            </div>
          )}
          {message.error && (
            <div className="text-red-500 border-l-2 px-4 bg-red-50 py-2 rounded">
              {message.error}
            </div>
          )}
        </div>
      )}

      <div className="space-y-8">
        {/* Pricing Tier Section */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Select Pricing Tier</h3>
          <RadioGroup
            value={selectedTierId || ""}
            onValueChange={setSelectedTierId}
            className="grid gap-4 sm:grid-cols-2"
          >
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative border rounded-xl p-6 cursor-pointer transition-all ${
                  selectedTierId === tier.id
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => setSelectedTierId(tier.id)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-lg">{tier.name}</h4>
                    <span className="font-bold text-blue-600 text-xl">
                      ₹{tier.price}
                    </span>
                  </div>
                  {tier.description && (
                    <p className="text-sm text-gray-600 flex-grow">
                      {tier.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Payment Details Section */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Payment Details</h3>

          <div className="grid gap-8 md:grid-cols-2">
            {/* UPI Information */}
            <div className="space-y-4">
              <div className="p-6 border rounded-xl bg-gray-50">
                <h4 className="font-semibold text-lg mb-3">
                  UPI Payment Information
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  Scan the QR code or use the UPI ID below to make your payment.
                </p>

                <div className="flex flex-col items-center">
                  <div className="bg-white p-3 rounded-xl mb-6 shadow-sm">
                    <Image
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="text-center w-full">
                    <p className="text-sm font-medium mb-2">UPI ID:</p>
                    <div className="bg-white px-4 py-2 rounded-lg border select-all text-sm font-mono">
                      {upiId}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="transactionId" className="text-base">
                  Transaction ID *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter UPI transaction ID"
                    className="h-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    disabled={!transactionId}
                    className="h-11 w-11"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={generateTestTransactionId}
                  className="w-full"
                >
                  Generate Test Transaction ID
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          className="flex-1 h-12 text-base"
          disabled={isSubmitting || !selectedTierId || !transactionId}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Payment...
            </>
          ) : (
            "Submit Payment"
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={createTestParticipant}
          disabled={isSubmitting || !selectedTierId}
          className="h-12 text-base"
        >
          Create Test Participant
        </Button>
      </div>
    </form>
  );
}
