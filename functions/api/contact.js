// Cloudflare Pages Function — receives the contact form POST and sends it by
// email using the account's Email Routing "send_email" binding.
//
// Setup needed in the Cloudflare dashboard (cannot be done from this file):
// 1. Email Routing must be enabled for vdtransform.com, with
//    nacho@vdtransform.com verified as a destination address.
// 2. In the Pages project settings > Functions > Bindings, add an
//    "Email" binding named SEND_EMAIL pointing at nacho@vdtransform.com.
// 3. Redeploy the Pages project after adding the binding.
//
// Reference: https://developers.cloudflare.com/email-routing/email-workers/

import { EmailMessage } from "cloudflare:email";

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
  const bodyText = `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`;
  const bodyHtml = `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Mensaje:</strong></p>
<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;

  const rawMessage = [
    `From: "VDTransform Web" <noreply@vdtransform.com>`,
    `To: nacho@vdtransform.com`,
    `Reply-To: ${email}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset="UTF-8"`,
    "",
    bodyHtml,
  ].join("\r\n");

  try {
    const msg = new EmailMessage("noreply@vdtransform.com", "nacho@vdtransform.com", rawMessage);
    await env.SEND_EMAIL.send(msg);
  } catch (err) {
    return new Response("No se pudo enviar el mensaje. Escribime directo a nacho@vdtransform.com.", { status: 502 });
  }

  const dest = lang === "en" ? "/en/gracias" : "/gracias";
  return Response.redirect(new URL(dest, request.url), 303);
}

export async function onRequestGet() {
  return new Response("Method not allowed", { status: 405 });
}
