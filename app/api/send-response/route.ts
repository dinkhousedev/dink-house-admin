import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { createClient } from "@supabase/supabase-js";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, inquiryId } = body;

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get site configuration - using Supabase Cloud storage
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dinkhousepb.com";
    const logoUrl = process.env.LOGO_URL || 'https://wchxzbuuwssrnaxshseu.supabase.co/storage/v1/object/public/dink-files/dinklogo.jpg';

    // Format the email HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #CDFE00 0%, #9BCF00 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .logo { max-width: 200px; height: auto; margin-bottom: 20px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #CDFE00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoUrl}" alt="The Dink House" class="logo" />
            <h2 style="color: white; margin: 0;">Response from The Dink House</h2>
        </div>
        <div class="content">
            <h3>${subject}</h3>
            <div style="white-space: pre-wrap; margin: 20px 0;">${message.replace(/\n/g, '<br>')}</div>

            <p style="margin-top: 30px;">If you have any further questions, please don't hesitate to reach out.</p>

            <center>
                <a href="${siteUrl}" class="button">Visit Our Website</a>
            </center>
        </div>
        <div class="footer">
            <p>The Dink House - Where Pickleball Lives</p>
            <p style="font-size: 12px;">© 2025 The Dink House. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    // Send email via SendGrid
    const msg = {
      to,
      from: {
        email: process.env.EMAIL_FROM || "hello@dinkhousepb.com",
        name: process.env.EMAIL_FROM_NAME || "The Dink House"
      },
      subject,
      html: htmlContent,
      text: `${subject}\n\n${message}\n\nIf you have any further questions, please don't hesitate to reach out.\n\n--\nThe Dink House - Where Pickleball Lives\nVisit us at: ${siteUrl}`
    };

    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
    } else {
      console.warn("SendGrid API key not configured");
    }

    // Log the email send
    if (inquiryId) {
      await supabase.rpc("log_email", {
        p_template_key: "admin_response",
        p_to_email: to,
        p_from_email: process.env.EMAIL_FROM || "hello@dinkhousepb.com",
        p_subject: subject,
        p_status: process.env.SENDGRID_API_KEY ? "sent" : "pending",
        p_metadata: {
          inquiry_id: inquiryId,
          type: "admin_response",
          sent_at: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Response sent successfully"
    });
  } catch (error) {
    console.error("Error sending response:", error);
    return NextResponse.json(
      { error: "Failed to send response" },
      { status: 500 }
    );
  }
}