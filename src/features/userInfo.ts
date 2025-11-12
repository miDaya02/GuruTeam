import fetch from "node-fetch";

export async function userInfo(context: any) {
  const user = context.activity.from;

  if (!user) {
    await context.send("No se pudo obtener la información del usuario.");
    return;
  }

  // Intenta obtener el correo desde Microsoft Graph
  let email = "No disponible";
  try {
    const token = process.env.GRAPH_API_TOKEN; // o genera uno usando client credentials
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${user.aadObjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: any = await res.json();
email = data.mail || data.userPrincipalName || "No disponible";

  } catch (error) {
    console.error("Error al obtener el correo:", error);
  }

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