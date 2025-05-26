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
    const requestData = await request.json();
    const {
      title,
      description,
      upiId,
      qrCodeUrl,
      eventDate,
      registrationDeadline,
      maxParticipants,
      pricingTiers,
    } = requestData;

    // Validate required fields
    if (!title || !upiId || !qrCodeUrl || !eventDate) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, upiId, qrCodeUrl, and eventDate are required",
        },
        { status: 400 },
      );
    }

    // Validate event date is in the future
    if (new Date(eventDate) <= new Date()) {
      return NextResponse.json(
        { error: "Event date must be in the future" },
        { status: 400 },
      );
    }

    // Validate registration deadline if provided
    if (
      registrationDeadline &&
      new Date(registrationDeadline) >= new Date(eventDate)
    ) {
      return NextResponse.json(
        { error: "Registration deadline must be before event date" },
        { status: 400 },
      );
    }

    // Validate pricing tiers
    if (!pricingTiers || pricingTiers.length === 0) {
      return NextResponse.json(
        { error: "At least one pricing tier is required" },
        { status: 400 },
      );
    }

    for (const tier of pricingTiers) {
      if (!tier.name || !tier.price || tier.price <= 0) {
        return NextResponse.json(
          {
            error:
              "All pricing tiers must have a name and price greater than 0",
          },
          { status: 400 },
        );
      }
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        organizer_id: user.id,
        upi_id: upiId.trim(),
        qr_code_url: qrCodeUrl,
        event_date: eventDate,
        registration_deadline: registrationDeadline || null,
        max_participants: maxParticipants || null,
        status: "active",
      })
      .select()
      .single();

    if (eventError) {
      console.error("Error creating event:", eventError);
      return NextResponse.json(
        {
          error: "Failed to create event",
          details: eventError.message || "Database error occurred",
        },
        { status: 500 },
      );
    }

    // Add pricing tiers
    const formattedTiers = pricingTiers.map((tier: any) => ({
      event_id: event.id,
      name: tier.name.trim(),
      description: tier.description?.trim() || null,
      price: parseFloat(tier.price),
    }));

    const { error: tiersError } = await supabase
      .from("pricing_tiers")
      .insert(formattedTiers);

    if (tiersError) {
      console.error("Error creating pricing tiers:", tiersError);
      // If tiers fail, we should delete the event to maintain consistency
      await supabase.from("events").delete().eq("id", event.id);
      return NextResponse.json(
        {
          error: "Failed to create pricing tiers",
          details: tiersError.message || "Database error occurred",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
      },
    });
  } catch (error) {
    console.error("Unexpected error creating event:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
