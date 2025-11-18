import fetch from "node-fetch";
import { DefaultAzureCredential } from "@azure/identity";
import { TurnContext } from "botbuilder";

export async function userInfo(context: TurnContext) {
  const user = context.activity.from;

  if (!user) {
    await context.sendActivity("No se pudo obtener la información del usuario.");
    return;
  }

  let email = "No disponible";
  let jobTitle = "";
  let department = "";
  let mobilePhone = "";

  // Intentar obtener información de Microsoft Graph
  if (user.aadObjectId) {
    try {
      const token = await getGraphToken();
      
      if (token) {
        console.log("✅ Token obtenido exitosamente");
        
        const graphUrl = `https://graph.microsoft.com/v1.0/users/${user.aadObjectId}`;
        console.log(`📞 Llamando a: ${graphUrl}`);
        
        const res = await fetch(graphUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (res.ok) {
          const data: any = await res.json();
          email = data.mail || data.userPrincipalName || "No disponible";
          jobTitle = data.jobTitle || "";
          department = data.department || "";
          mobilePhone = data.mobilePhone || "";
          
          console.log("✅ Datos obtenidos correctamente:", {
            email,
            jobTitle,
            department
          });
        } else {
          const errorText = await res.text();
          console.error("❌ Error en Graph API:", res.status, res.statusText);
          console.error("Respuesta:", errorText);
        }
      }
    } catch (error: any) {
      console.error("❌ Error al obtener datos:", error.message);
    }
  }

  // Construir mensaje
  let message = `**📋 Información del usuario**

👤 **Nombre:** ${user.name || "Desconocido"}
🆔 **ID:** ${user.id}
📧 **Correo:** ${email}
🔑 **AAD Object ID:** ${user.aadObjectId || "No disponible"}`;

  if (jobTitle) {
    message += `\n💼 **Cargo:** ${jobTitle}`;
  }
  if (department) {
    message += `\n🏢 **Departamento:** ${department}`;
  }
  if (mobilePhone) {
    message += `\n📱 **Teléfono:** ${mobilePhone}`;
  }

  console.log("📤 Enviando respuesta al usuario...");
  await context.sendActivity(message);
  console.log("✅ Respuesta enviada");
}

async function getGraphToken(): Promise<string | null> {
  const isAzure = process.env.RUNNING_ON_AZURE === '1';
  
  console.log(`🔐 Modo de autenticación: ${isAzure ? 'Azure Managed Identity' : 'Client Credentials'}`);
  
  if (isAzure) {
    return getTokenWithManagedIdentity();
  } else {
    return getTokenWithClientSecret();
  }
}

async function getTokenWithManagedIdentity(): Promise<string | null> {
  try {
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken("https://graph.microsoft.com/.default");
    
    console.log("✅ Token obtenido con Managed Identity");
    return tokenResponse.token;
  } catch (error: any) {
    console.error("❌ Error obteniendo token con Managed Identity:", error.message);
    return null;
  }
}

async function getTokenWithClientSecret(): Promise<string | null> {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;

  if (!clientId || !tenantId) {
    console.error("❌ Faltan CLIENT_ID o TENANT_ID");
    return null;
  }

  if (!clientSecret) {
    console.error("❌ Falta CLIENT_SECRET");
    return null;
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    console.log(`🔐 Solicitando token para tenant: ${tenantId}`);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error obteniendo token:", response.status, response.statusText);
      console.error("Detalles:", errorText);
      return null;
    }

    const data: any = await response.json();
    console.log("✅ Token obtenido con Client Secret");
    return data.access_token;
  } catch (error: any) {
    console.error("❌ Error en getTokenWithClientSecret:", error.message);
    return null;
  }
}