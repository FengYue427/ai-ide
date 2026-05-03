interface SendVerificationRequestParams {
  identifier: string
  url: string
  provider: {
    server: string
    from: string
  }
}

export async function sendVerificationRequest({
  identifier: email,
  url,
  provider: { server, from }
}: SendVerificationRequestParams) {
  // 使用 Resend API 发送邮件
  const resendApiKey = process.env.RESEND_API_KEY
  
  if (resendApiKey) {
    // 使用 Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: from || "noreply@aide.dev",
        to: email,
        subject: "登录到 AI IDE",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">登录到 AI IDE</h2>
            <p>点击下方链接完成登录：</p>
            <a href="${url}" 
               style="display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              点击登录
            </a>
            <p style="color: #666; font-size: 14px;">或复制链接：${url}</p>
            <p style="color: #999; font-size: 12px;">此链接有效期为 24 小时，请勿分享给他人。</p>
          </div>
        `
      })
    })
    
    if (!res.ok) {
      throw new Error("Failed to send email via Resend")
    }
  } else {
    // 备用：SMTP 方式
    console.log("Magic link for", email, url)
    throw new Error("Email provider not configured")
  }
}
