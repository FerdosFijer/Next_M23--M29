import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASS,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "sqlite", ...etc
  }),
  trustedOrigins: [process.env.APP_URL!],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: false
      },
      phone: {
        type: "string",
        required: false
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`
        const info = await transporter.sendMail({
          from: '"Prisma Blog" <prismablog@ph.com>', // sender address
          to: user.email, // list of recipients
          subject: "Please verify your email!", // subject line
          html: `
                
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>

<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: Arial, Helvetica, sans-serif; color: #333333;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background-color: #f4f4f7; padding: 30px 10px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td align="center"
              style="background-color: #4f46e5; padding: 30px 20px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Prisma Blog
              </h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 14px;">
                Ideas, stories, and inspiration.
              </p>
            </td>
          </tr>

          <!-- Email Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
                Verify Your Email Address
              </h2>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7;">
                Hello, ${user.name}
              </p>

              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #4b5563;">
                Thank you for creating an account with <strong>Prisma Blog</strong>.
                Please verify your email address by clicking the button below.
              </p>

              <!-- Verification Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                align="center" style="margin: 0 auto 25px;">
                <tr>
                  <td align="center" bgcolor="#4f46e5"
                    style="border-radius: 6px;">
                    <a href="${verificationUrl}"
                      target="_blank"
                      style="display: inline-block; padding: 15px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                If the button doesn't work, copy and paste the following link into your browser:
              </p>

              <p style="margin: 0 0 25px; font-size: 13px; line-height: 1.6; word-break: break-all;">
                <a href="${url}"
                  target="_blank"
                  style="color: #4f46e5; text-decoration: underline;">
                  ${verificationUrl}
                </a>
              </p>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.7; color: #6b7280;">
                For your security, this verification link will expire after a limited time.
              </p>

              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #6b7280;">
                If you did not create this account, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="background-color: #f9fafb; padding: 22px 20px; border-top: 1px solid #e5e7eb;">

              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">
                Thank you for joining Prisma Blog!
              </p>

              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; Prisma Blog. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
        });
        console.log("Message sent: %s", info.messageId);
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },

  socialProviders: {
    google: {
      accessType: "offline",
      prompt: "select_account consent",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },


});