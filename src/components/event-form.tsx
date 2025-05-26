"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Loader2, Upload, X } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import Image from "next/image";

type PricingTier = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function EventForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    success?: string;
    error?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    upiId: "",
    eventDate: "",
    registrationDeadline: "",
    maxParticipants: "",
  });

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { id: "1", name: "Standard", description: "Regular entry", price: 100 },
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTierChange = (
    id: string,
    field: keyof PricingTier,
    value: string,
  ) => {
    setPricingTiers((prev) =>
      prev.map((tier) =>
        tier.id === id
          ? {
              ...tier,
              [field]: field === "price" ? parseFloat(value) || 0 : value,
            }
          : tier,
      ),
    );
  };

  const addPricingTier = () => {
    const newId = (pricingTiers.length + 1).toString();
    setPricingTiers([
      ...pricingTiers,
      { id: newId, name: "", description: "", price: 0 },
    ]);
  };

  const removePricingTier = (id: string) => {
    if (pricingTiers.length > 1) {
      setPricingTiers(pricingTiers.filter((tier) => tier.id !== id));
    }
  };

  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQr(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "qr-codes");

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload QR code");
      }

      setQrCodeUrl(data.url);
    } catch (error) {
      console.error("Error uploading QR code:", error);
      setMessage({
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload QR code. Please try again.",
      });
    } finally {
      setIsUploadingQr(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setMessage({ error: "Event title is required" });
      return false;
    }
    if (!formData.upiId.trim()) {
      setMessage({ error: "UPI ID is required" });
      return false;
    }
    if (!qrCodeUrl) {
      setMessage({ error: "QR code is required" });
      return false;
    }
    if (!formData.eventDate) {
      setMessage({ error: "Event date is required" });
      return false;
    }
    if (new Date(formData.eventDate) <= new Date()) {
      setMessage({ error: "Event date must be in the future" });
      return false;
    }
    if (
      formData.registrationDeadline &&
      new Date(formData.registrationDeadline) >= new Date(formData.eventDate)
    ) {
      setMessage({ error: "Registration deadline must be before event date" });
      return false;
    }
    if (pricingTiers.some((tier) => !tier.name.trim() || tier.price <= 0)) {
      setMessage({
        error: "All pricing tiers must have a name and price greater than 0",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          qrCodeUrl,
          maxParticipants: formData.maxParticipants
            ? parseInt(formData.maxParticipants)
            : null,
          pricingTiers: pricingTiers.map(({ id, ...rest }) => rest),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      setMessage({ success: "Event created successfully!" });

      setTimeout(() => {
        router.push("/dashboard/manage-events");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error creating event:", error);
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
    <div className="bg-white rounded-lg border p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        {message && <FormMessage message={message} />}

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Event Details</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your event..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="upiId">UPI ID *</Label>
                <Input
                  id="upiId"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  placeholder="yourname@upi"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="qrCode">UPI QR Code *</Label>
                {qrCodeUrl ? (
                  <div className="relative inline-block">
                    <div className="relative h-48 w-48 rounded-md overflow-hidden border">
                      <Image
                        src={qrCodeUrl}
                        alt="UPI QR Code"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-48"
                      onClick={() => setQrCodeUrl("")}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 w-48 h-48 cursor-pointer hover:bg-gray-100 transition-colors">
                      {isUploadingQr ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                          <p className="text-sm text-gray-500">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 mb-2 text-center">
                            Upload QR Code
                          </p>
                          <p className="text-xs text-gray-400 text-center">
                            PNG, JPG up to 5MB
                          </p>
                        </>
                      )}
                      <input
                        id="qrCode"
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleQrCodeUpload}
                        disabled={isUploadingQr}
                        required={!qrCodeUrl}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="eventDate">Event Date *</Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="datetime-local"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="registrationDeadline">
                    Registration Deadline
                  </Label>
                  <Input
                    id="registrationDeadline"
                    name="registrationDeadline"
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxParticipants">Maximum Participants</Label>
                <Input
                  id="maxParticipants"
                  name="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Pricing Tiers</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPricingTier}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Tier
              </Button>
            </div>

            <div className="space-y-4">
              {pricingTiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className="grid gap-4 p-4 border rounded-md bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Tier {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePricingTier(tier.id)}
                      disabled={pricingTiers.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`tier-${tier.id}-name`}>Name *</Label>
                      <Input
                        id={`tier-${tier.id}-name`}
                        value={tier.name}
                        onChange={(e) =>
                          handleTierChange(tier.id, "name", e.target.value)
                        }
                        placeholder="e.g., Standard"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`tier-${tier.id}-description`}>
                        Description
                      </Label>
                      <Input
                        id={`tier-${tier.id}-description`}
                        value={tier.description}
                        onChange={(e) =>
                          handleTierChange(
                            tier.id,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="e.g., Regular entry"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`tier-${tier.id}-price`}>
                        Price (₹) *
                      </Label>
                      <Input
                        id={`tier-${tier.id}-price`}
                        type="number"
                        min="1"
                        step="1"
                        value={tier.price}
                        onChange={(e) =>
                          handleTierChange(tier.id, "price", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || !qrCodeUrl}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              "Create Event"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/manage-events")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
