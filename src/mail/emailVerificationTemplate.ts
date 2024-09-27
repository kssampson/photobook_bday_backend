export const emailVerificationTemplate = (otpCode: string, expiresAt: Date) => {
  return (
    `
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Your OTP Code</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
        <div style="padding: 20px;">
          <h2 style="color: #333333;">Your OTP Code</h2>
          <p style="color: #666666;">Please use the following code to complete your two-factor authentication process:</p>
          <h3 style="color: #007bff;">${otpCode}</h3>
          <p style="color: #666666;">This code will expire at ${expiresAt.toLocaleString()}. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
  )
}