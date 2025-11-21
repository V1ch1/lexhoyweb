import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendWelcomeEmail(email: string, name: string) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set. Skipping email.");
      return;
    }

    try {
      await resend.emails.send({
        from: "LexHoy <noreply@lexhoy.com>",
        to: email,
        subject: "Bienvenido a LexHoy",
        html: `
          <h1>Bienvenido a LexHoy, ${name}!</h1>
          <p>Gracias por registrarte en nuestra plataforma de leads legales.</p>
          <p>Empieza a recibir clientes potenciales hoy mismo.</p>
        `,
      });
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }

  static async sendLeadPurchasedEmail(
    email: string,
    leadName: string,
    leadId: string
  ) {
    if (!process.env.RESEND_API_KEY) return;

    try {
      await resend.emails.send({
        from: "LexHoy <noreply@lexhoy.com>",
        to: email,
        subject: `Nuevo Lead Comprado: ${leadName}`,
        html: `
          <h1>Has comprado un nuevo lead</h1>
          <p>Detalles del lead:</p>
          <ul>
            <li>ID: ${leadId}</li>
            <li>Nombre: ${leadName}</li>
          </ul>
          <p>Puedes ver los detalles completos en tu panel de control.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${leadId}">Ver Lead</a>
        `,
      });
    } catch (error) {
      console.error("Error sending purchase email:", error);
    }
  }

  static async sendAuctionWonEmail(
    email: string,
    leadId: string,
    amount: number
  ) {
    if (!process.env.RESEND_API_KEY) return;

    try {
      await resend.emails.send({
        from: "LexHoy <noreply@lexhoy.com>",
        to: email,
        subject: `¡Has ganado la subasta del lead #${leadId.slice(0, 8)}!`,
        html: `
          <h1>¡Felicidades!</h1>
          <p>Has ganado la subasta por el lead #${leadId} con una puja de ${amount}€.</p>
          <p>Accede a tu panel para ver los datos de contacto.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${leadId}">Ver Lead</a>
        `,
      });
    } catch (error) {
      console.error("Error sending auction won email:", error);
    }
  }
}
