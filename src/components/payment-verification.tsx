"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Payment = {
  id: string;
  user_id: string;
  amount: number;
  transaction_id: string | null;
  upi_reference: string | null;
  payment_screenshot_url: string;
  status: "pending" | "verified" | "rejected";
  created_at: string;
  user: {
    name: string;
    email: string;
  };
};

type PaymentVerificationProps = {
  payments: Payment[];
  eventId: string;
};

export default function PaymentVerification({
  payments,
  eventId,
}: PaymentVerificationProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pending");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState<{
    success?: string;
    error?: string;
  } | null>(null);

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const verifiedPayments = payments.filter((p) => p.status === "verified");
  const rejectedPayments = payments.filter((p) => p.status === "rejected");

  const handleVerify = async (
    paymentId: string,
    status: "verified" | "rejected",
  ) => {
    setProcessingPaymentId(paymentId);
    setMessage(null);

    try {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          status,
          verificationNotes: verificationNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${status} payment`);
      }

      setMessage({ success: `Payment ${status} successfully` });
      setVerificationNotes("");
      router.refresh();
    } catch (error) {
      console.error(`Error ${status}ing payment:`, error);
      setMessage({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const renderPaymentCard = (payment: Payment) => (
    <div
      key={payment.id}
      className="border rounded-lg overflow-hidden bg-white shadow-sm"
    >
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">
              {payment.user.name || "Anonymous User"}
            </h3>
            <p className="text-sm text-gray-500">{payment.user.email}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">₹{payment.amount}</p>
            <p className="text-xs text-gray-500">
              {new Date(payment.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {payment.transaction_id && (
          <div className="mb-2">
            <span className="text-sm font-medium">Transaction ID:</span>
            <span className="text-sm ml-2">{payment.transaction_id}</span>
          </div>
        )}

        {payment.upi_reference && (
          <div className="mb-4">
            <span className="text-sm font-medium">Reference:</span>
            <span className="text-sm ml-2">{payment.upi_reference}</span>
          </div>
        )}

        <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden bg-gray-100">
          {payment.payment_screenshot_url ? (
            <div className="relative h-64 w-full">
              <Image
                src={payment.payment_screenshot_url}
                alt="Payment Screenshot"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100">
              <AlertCircle className="h-12 w-12 text-gray-400" />
              <p className="text-gray-500">No screenshot available</p>
            </div>
          )}
        </div>
      </div>

      {payment.status === "pending" && (
        <div className="p-4 border-t">
          <div className="mb-4">
            <Label htmlFor={`notes-${payment.id}`}>
              Verification Notes (Optional)
            </Label>
            <Textarea
              id={`notes-${payment.id}`}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleVerify(payment.id, "verified")}
              className="flex-1"
              variant="default"
              disabled={processingPaymentId === payment.id}
            >
              {processingPaymentId === payment.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Verify
            </Button>

            <Button
              onClick={() => handleVerify(payment.id, "rejected")}
              className="flex-1"
              variant="destructive"
              disabled={processingPaymentId === payment.id}
            >
              {processingPaymentId === payment.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {message && <FormMessage message={message} />}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({verifiedPayments.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingPayments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {pendingPayments.map(renderPaymentCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No pending payments to verify</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="mt-6">
          {verifiedPayments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {verifiedPayments.map(renderPaymentCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No verified payments yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedPayments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {rejectedPayments.map(renderPaymentCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No rejected payments</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
