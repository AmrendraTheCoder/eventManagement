"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Plus,
  Loader2,
  Upload,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  FileText,
  QrCode,
  Users,
  Clock,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { FormMessage } from "@/components/form-message";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type PricingTier = {
  id: string;
  name: string;
  description: string;
  price: number;
};

type Message = { success: string } | { error: string } | { message: string };

const steps = [
  {
    number: 1,
    title: "Basic Information",
    description: "Tell us about your event",
    icon: FileText,
    color: "from-gray-500 to-gray-600",
  },
  {
    number: 2,
    title: "Payment Setup",
    description: "Configure payment details",
    icon: QrCode,
    color: "from-gray-500 to-gray-600",
  },
  {
    number: 3,
    title: "Schedule & Pricing",
    description: "Set dates and pricing tiers",
    icon: Calendar,
    color: "from-gray-500 to-gray-600",
  },
];

export default function EventForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTierChange = (
    id: string,
    field: keyof PricingTier,
    value: string
  ) => {
    setPricingTiers((prev) =>
      prev.map((tier) =>
        tier.id === id
          ? {
              ...tier,
              [field]: field === "price" ? parseFloat(value) || 0 : value,
            }
          : tier
      )
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
      toast.success("QR code uploaded successfully!");
    } catch (error) {
      console.error("Error uploading QR code:", error);
      toast.error("Failed to upload QR code. Please try again.");
    } finally {
      setIsUploadingQr(false);
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          toast.error("Event title is required");
          return false;
        }
        if (!formData.description.trim()) {
          toast.error("Event description is required");
          return false;
        }
        return true;
      case 2:
        if (!formData.upiId.trim()) {
          toast.error("UPI ID is required");
          return false;
        }
        if (!qrCodeUrl) {
          toast.error("QR code is required");
          return false;
        }
        return true;
      case 3:
        if (!formData.eventDate) {
          toast.error("Event date is required");
          return false;
        }
        if (new Date(formData.eventDate) <= new Date()) {
          toast.error("Event date must be in the future");
          return false;
        }
        if (pricingTiers.some((tier) => !tier.name.trim() || tier.price <= 0)) {
          toast.error(
            "All pricing tiers must have a name and price greater than 0"
          );
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
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

      toast.success("Event created successfully! 🎉");

      setTimeout(() => {
        router.push("/dashboard/manage-events");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const createTestEvent = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const testEventData = {
        title: "Test Event " + new Date().toLocaleDateString(),
        description: "This is a test event created for demonstration purposes.",
        upiId: "test@upi",
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
        registrationDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
        maxParticipants: "100",
        qrCodeUrl:
          "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
        pricingTiers: [
          { name: "Standard", description: "Regular entry", price: 100 },
          { name: "VIP", description: "Premium access", price: 500 },
        ],
      };

      const response = await fetch("/api/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testEventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create test event");
      }

      toast.success("Test event created successfully! 🎉");

      setTimeout(() => {
        router.push("/dashboard/manage-events");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error creating test event:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="relative">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep === step.number
                      ? `bg-gradient-to-r ${step.color} text-white shadow-lg`
                      : currentStep > step.number
                        ? "bg-gray-500 text-white"
                        : "bg-gray-200 text-gray-400"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </motion.div>

                {currentStep === step.number && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 opacity-25"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`w-24 h-1 mx-2 rounded-full transition-all duration-300 ${
                    currentStep > step.number ? "bg-gray-500" : "bg-gray-200"
                  }`}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Current Step Info */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-gray-600">{steps[currentStep - 1].description}</p>
        </motion.div>
      </div>

      {/* Form Content */}
      <motion.div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="group">
                    <Label
                      htmlFor="title"
                      className="text-sm font-medium text-gray-700 mb-2 flex items-center"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                      Event Title
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter a catchy event title"
                      className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      required
                    />
                  </div>

                  <div className="group">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-700 mb-2 flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe what your event is about..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="group">
                    <Label
                      htmlFor="upiId"
                      className="text-sm font-medium text-gray-700 mb-2 flex items-center"
                    >
                      <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                      UPI ID
                    </Label>
                    <Input
                      id="upiId"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      placeholder="yourname@upi"
                      className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      required
                    />
                  </div>

                  <div className="group">
                    <Label
                      htmlFor="qrCode"
                      className="text-sm font-medium text-gray-700 mb-2 flex items-center"
                    >
                      <QrCode className="w-4 h-4 mr-2 text-purple-500" />
                      UPI QR Code
                    </Label>

                    {qrCodeUrl ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                      >
                        <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-purple-200 shadow-lg">
                          <Image
                            src={qrCodeUrl}
                            alt="UPI QR Code"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4 mx-auto flex items-center hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
                          onClick={() => setQrCodeUrl("")}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove QR Code
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative"
                      >
                        <label className="block cursor-pointer">
                          <div className="w-64 h-64 mx-auto rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 flex flex-col items-center justify-center hover:bg-purple-100 hover:border-purple-400 transition-all">
                            {isUploadingQr ? (
                              <div className="flex flex-col items-center">
                                <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
                                <p className="text-sm text-purple-600 font-medium">
                                  Uploading...
                                </p>
                              </div>
                            ) : (
                              <>
                                <motion.div
                                  animate={{ y: [0, -10, 0] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  <Upload className="h-12 w-12 text-purple-400 mb-4" />
                                </motion.div>
                                <p className="text-sm text-purple-600 font-medium mb-2">
                                  Click to upload QR Code
                                </p>
                                <p className="text-xs text-purple-500">
                                  PNG, JPG up to 5MB
                                </p>
                              </>
                            )}
                          </div>
                          <input
                            id="qrCode"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleQrCodeUpload}
                            disabled={isUploadingQr}
                            required={!qrCodeUrl}
                          />
                        </label>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Schedule & Pricing */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="group">
                    <Label
                      htmlFor="eventDate"
                      className="text-sm font-medium text-gray-700 mb-2 flex items-center"
                    >
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      Event Date
                    </Label>
                    <Input
                      id="eventDate"
                      name="eventDate"
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      required
                    />
                  </div>

                  <div className="group">
                    <Label
                      htmlFor="registrationDeadline"
                      className="text-sm font-medium text-gray-700 mb-2 flex items-center"
                    >
                      <Clock className="w-4 h-4 mr-2 text-orange-500" />
                      Registration Deadline
                    </Label>
                    <Input
                      id="registrationDeadline"
                      name="registrationDeadline"
                      type="datetime-local"
                      value={formData.registrationDeadline}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    />
                  </div>
                </div>

                <div className="group">
                  <Label
                    htmlFor="maxParticipants"
                    className="text-sm font-medium text-gray-700 mb-2 flex items-center"
                  >
                    <Users className="w-4 h-4 mr-2 text-purple-500" />
                    Maximum Participants
                  </Label>
                  <Input
                    id="maxParticipants"
                    name="maxParticipants"
                    type="number"
                    min="1"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                      Pricing Tiers
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPricingTier}
                      className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tier
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <AnimatePresence>
                      {pricingTiers.map((tier, index) => (
                        <motion.div
                          key={tier.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="relative p-6 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-gray-200 hover:shadow-md transition-all"
                        >
                          <div className="absolute top-4 right-4">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePricingTier(tier.id)}
                              disabled={pricingTiers.length <= 1}
                              className="hover:bg-red-100 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <Label
                                htmlFor={`tier-${tier.id}-name`}
                                className="text-sm font-medium text-gray-700 mb-1"
                              >
                                Tier Name
                              </Label>
                              <Input
                                id={`tier-${tier.id}-name`}
                                value={tier.name}
                                onChange={(e) =>
                                  handleTierChange(
                                    tier.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Standard"
                                className="w-full px-3 py-2 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                              />
                            </div>

                            <div>
                              <Label
                                htmlFor={`tier-${tier.id}-description`}
                                className="text-sm font-medium text-gray-700 mb-1"
                              >
                                Description
                              </Label>
                              <Input
                                id={`tier-${tier.id}-description`}
                                value={tier.description}
                                onChange={(e) =>
                                  handleTierChange(
                                    tier.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Regular entry"
                                className="w-full px-3 py-2 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              />
                            </div>

                            <div>
                              <Label
                                htmlFor={`tier-${tier.id}-price`}
                                className="text-sm font-medium text-gray-700 mb-1"
                              >
                                Price (₹)
                              </Label>
                              <Input
                                id={`tier-${tier.id}-price`}
                                type="number"
                                min="1"
                                step="1"
                                value={tier.price}
                                onChange={(e) =>
                                  handleTierChange(
                                    tier.id,
                                    "price",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSubmitting}
              className={`${
                currentStep === 1 ? "invisible" : ""
              } hover:bg-gray-50 transition-all`}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/manage-events")}
                disabled={isSubmitting}
                className="hover:bg-gray-50 transition-all"
              >
                Cancel
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="bg-gray-600 hover:bg-gray-700 text-white transition-all"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={createTestEvent}
                    disabled={isSubmitting}
                    className="bg-gray-500 hover:bg-gray-600 text-white transition-all"
                  >
                    Create Test Event
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !qrCodeUrl}
                    className="bg-gray-600 hover:bg-gray-700 text-white transition-all min-w-[150px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Create Event
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
