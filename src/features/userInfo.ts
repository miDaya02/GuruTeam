import fetch, { Response } from "node-fetch";

interface TeamsUser {
  id?: string;
  name?: string;
  aadObjectId?: string;
  email?: string;
  userPrincipalName?: string;
}

export async function userInfo(context: any): Promise<void> {
  const user: TeamsUser | undefined = context.activity?.from;

  if (!user) {
    await context.send("No se pudo obtener la información del usuario.");
    return;
  }

  const clientId: string | undefined = process.env.BOT_ID;
  const clientSecret: string | undefined = process.env.SECRET_BOT_PASSWORD;
  const tenantId: string | undefined = process.env.TEAMS_APP_TENANT_ID;

  let email: string = "No disponible";

  try {
    // 1️⃣ Solicitar token a Azure AD
    const tokenRes: Response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:
        `client_id=${encodeURIComponent(clientId ?? "")}` +
        `&client_secret=${encodeURIComponent(clientSecret ?? "")}` +
        `&scope=${encodeURIComponent("https://graph.microsoft.com/.default")}` +
        `&grant_type=client_credentials`,
    });

    const tokenData: any = await tokenRes.json();
    const token: string | undefined = tokenData.access_token;

    if (!token) {
      console.error("No se pudo obtener token:", tokenData);
      await context.send("No se pudo obtener el token de autenticación.");
      return;
    }

    // 2️⃣ Consultar correo en Microsoft Graph
    const graphRes: Response = await fetch(`https://graph.microsoft.com/v1.0/users/${user.aadObjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data: any = await graphRes.json();
    email = data.mail || data.userPrincipalName || "No disponible";
  } catch (error) {
    console.error("Error al obtener el correo:", error);
  }

  // 3️⃣ Mostrar mensaje final
  const message = `
  __________________________________________
  **Información del usuario**
  - Nombre: ${user.name || "Desconocido"}
  - ID: ${user.id}
  - Correo: ${email}
  __________________________________________
  `;

  await context.send(message);
}
