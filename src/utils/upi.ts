import { createClient } from "../../supabase/server";

/**
 * Validate a UPI transaction ID format
 * @param transactionId The transaction ID to validate
 * @returns Boolean indicating if the format is valid
 */
export function validateUpiTransactionId(transactionId: string): boolean {
  // UPI transaction IDs typically follow patterns like:
  // - 12-digit numeric IDs
  // - Alphanumeric IDs with specific prefixes
  // - Test transaction IDs for development
  const patterns = [
    /^\d{12}$/, // 12-digit numeric
    /^[A-Za-z0-9]{14,18}$/, // 14-18 character alphanumeric
    /^UPI[A-Za-z0-9]{10,15}$/, // UPI prefix followed by 10-15 alphanumeric
    /^TEST_\d+_[A-Z0-9]{6}$/, // Test transaction ID format
  ];

  return patterns.some((pattern) => pattern.test(transactionId));
}

/**
 * Check if a payment screenshot has been used before
 * @param imageUrl URL of the payment screenshot
 * @param eventId ID of the event
 * @returns Boolean indicating if the screenshot is a duplicate
 */
export async function isDuplicateScreenshot(
  imageUrl: string,
  eventId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payments")
    .select("id")
    .eq("event_id", eventId)
    .eq("payment_screenshot_url", imageUrl)
    .limit(1);

  if (error) {
    console.error("Error checking for duplicate screenshot:", error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Generate a unique reference ID for a payment
 * @param eventId ID of the event
 * @param userId ID of the user
 * @returns A unique reference string
 */
export function generatePaymentReference(
  eventId: string,
  userId: string,
): string {
  const timestamp = Date.now().toString().slice(-6);
  const eventPrefix = eventId.slice(0, 4);
  const userPrefix = userId.slice(0, 4);

  return `${eventPrefix}${userPrefix}${timestamp}`;
}
