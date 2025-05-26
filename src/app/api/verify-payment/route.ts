import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { paymentId, status, verificationNotes } = await request.json();

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify the user is the event organizer
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("event_id, user_id")
      .eq("id", paymentId)
      .single();

    if (paymentError) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", payment.event_id)
      .single();

    if (eventError || event.organizer_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to verify this payment" },
        { status: 403 },
      );
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status,
        verification_notes: verificationNotes,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update payment status" },
        { status: 500 },
      );
    }

    // If payment is verified, update participant status
    if (status === "verified") {
      const { error: participantError } = await supabase
        .from("participants")
        .update({
          status: "confirmed",
        })
        .eq("payment_id", paymentId);

      if (participantError) {
        console.error("Error updating participant status:", participantError);
        // Continue despite error with participant update
      }
    } else if (status === "rejected") {
      const { error: participantError } = await supabase
        .from("participants")
        .update({
          status: "cancelled",
        })
        .eq("payment_id", paymentId);

      if (participantError) {
        console.error("Error updating participant status:", participantError);
        // Continue despite error with participant update
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment ${status} successfully`,
    });
  } catch (error) {
    console.error("Unexpected error verifying payment:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
