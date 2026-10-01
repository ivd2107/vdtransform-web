// Cloudflare Pages Function — receives the contact form POST and sends it by
// email using the Resend API.
//
// Setup needed:
// 1. Domain vdtransform.com verified in Resend (DKIM + SPF records added).
// 2. In the Pages project settings > Environment variables, add a secret
//    named RESEND_API_KEY with the API key generated in Resend.
// 3. Redeploy the Pages project after adding the variable.

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let form;
  try {
    form = await request.formData();
  } catch (err) {
    return new Response("Bad request", { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (form.get("company")) {
    return Response.redirect(new URL("/gracias", request.url), 303);
  }

  const name = (form.get("name") || "").toString().trim().slice(0, 120);
  const email = (form.get("email") || "").toString().trim().slice(0, 160);
  const message = (form.get("message") || "").toString().trim().slice(0, 2000);
  const consent = form.get("consent");

  if (!name || !email || !message || !consent) {
    return new Response("Missing required fields", { status: 400 });
  }

  const referer = request.headers.get("referer") || "";
  const lang = referer.includes("/en/") ? "en" : "es";

  const subject = `Nuevo contacto desde vdtransform.com — ${name}`;
  const bodyHtml = `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Mensaje:</strong></p>
<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "VDTransform Web <noreply@vdtransform.com>",
        to: "nacho@vdtransform.com",
        reply_to: email,
        subject: subject,
        html: bodyHtml,
      }),
    });

    if (!resendResponse.ok) {
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }
  } catch (err) {
    return new Response("No se pudo enviar el mensaje. Escribime directo a nacho@vdtransform.com.", { status: 502 });
  }

  const dest = lang === "en" ? "/en/gracias" : "/gracias";
  return Response.redirect(new URL(dest, request.url), 303);
}

export async function onRequestGet() {
  return new Response("Method not allowed", { status: 405 });
}
