// app/api/capture/route.ts
export async function POST(req: Request) {
  // Save to database
  // Send transactional email via Resend/Postmark
  // Return shareable URL
  // Use crypto or UUID
  const shareableId = crypto.randomUUID();
  const publicUrl = `https://yourapp.com/share/${shareableId}`;

  // Store stripped version (no email/company name)
}
