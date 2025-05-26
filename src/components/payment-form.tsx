"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { Loader2, Upload } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    success?: string;
    error?: string;
  } | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    pricingTiers[0]?.id || null,
  );
  const [transactionId, setTransactionId] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const selectedTier = pricingTiers.find((tier) => tier.id === selectedTierId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      // In a real implementation, you would upload to Supabase storage
      // For this demo, we'll simulate an upload with a timeout
      // and use a placeholder image URL

      // Simulating upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation, you would get the URL from the upload response
      const fakeUploadUrl = `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80`;
      setScreenshotUrl(fakeUploadUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage({ error: "Failed to upload screenshot. Please try again." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTierId) {
      setMessage({ error: "Please select a pricing tier" });
      return;
    }

    if (!screenshotUrl) {
      setMessage({ error: "Please upload a payment screenshot" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          pricingTierId: selectedTierId,
          amount: selectedTier?.price || 0,
          transactionId: transactionId || null,
          paymentScreenshotUrl: screenshotUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit payment");
      }

      setMessage({
        success:
          "Payment submitted successfully! It will be verified by the organizer.",
      });

      // Reset form
      setTransactionId("");
      setScreenshotUrl("");

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
      {message && <FormMessage message={message} />}

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Pricing Tier</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedTierId === tier.id ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"}`}
                onClick={() => setSelectedTierId(tier.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{tier.name}</h4>
                  <span className="font-bold">₹{tier.price}</span>
                </div>
                {tier.description && (
                  <p className="text-sm text-gray-600">{tier.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Payment Details</h3>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">UPI Payment Information</h4>
                <p className="text-sm mb-4">
                  Scan the QR code or use the UPI ID below to make your payment.
                </p>

                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg mb-4">
                    <Image
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      width={200}
                      height={200}
                      className="rounded-md"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">UPI ID:</p>
                    <p className="text-sm bg-white px-3 py-1 rounded border select-all">
                      {upiId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter UPI transaction ID"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="screenshot">Payment Screenshot *</Label>

                {screenshotUrl ? (
                  <div className="relative">
                    <div className="relative h-48 w-full rounded-md overflow-hidden">
                      <Image
                        src={screenshotUrl}
                        alt="Payment Screenshot"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setScreenshotUrl("")}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                        <p className="text-sm text-gray-500">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-2">
                          Click to upload payment screenshot
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG up to 5MB
                        </p>
                      </>
                    )}
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !selectedTierId || !screenshotUrl}
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
    </form>
  );
}
