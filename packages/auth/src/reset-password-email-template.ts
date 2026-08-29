const COLORS = {
  page: "#FFFFFF",
  ink: "#171717",
  muted: "#737373",
  line: "#E5E5E5",
  button: "#171717",
  buttonText: "#FFFFFF",
} as const;

export function renderResetPasswordEmailHtml(input: {
  resetUrl: string;
  homeUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset your SoHappyPDF password</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.page};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Use this link to choose a new password. It expires soon.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.page};">
      <tr>
        <td align="center" style="padding:48px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <tr>
              <td style="padding-bottom:32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;">
                <a href="${input.homeUrl}" style="color:${COLORS.ink};text-decoration:none;">SoHappyPDF</a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:12px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:${COLORS.ink};">
                Reset your password
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${COLORS.muted};">
                We received a request to reset the password for your account. This link expires soon.
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="${COLORS.button}" style="border-radius:8px;">
                      <a href="${input.resetUrl}" style="display:inline-block;padding:12px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${COLORS.buttonText};text-decoration:none;">Reset password</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:28px;border-bottom:1px solid ${COLORS.line};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${COLORS.muted};word-break:break-all;">
                Or paste this link into your browser:<br />
                <a href="${input.resetUrl}" style="color:${COLORS.ink};text-decoration:none;">${input.resetUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${COLORS.muted};">
                If you did not request this, you can ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderResetPasswordEmailText(input: {
  resetUrl: string;
}): string {
  return [
    "SoHappyPDF",
    "",
    "Reset your password",
    "",
    "We received a request to reset the password for your account. This link expires soon.",
    "",
    `Reset password: ${input.resetUrl}`,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}
