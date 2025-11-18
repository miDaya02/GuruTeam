import restify from "restify";
import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  ConfigurationBotFrameworkAuthentication,
  TurnContext,
} from "botbuilder";
import { TeamsBot } from "./app";
import config from "./config";

// Crear servidor HTTP
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

const PORT = process.env.port || process.env.PORT || 3978;

server.listen(PORT, () => {
  console.log(`\n✅ ${server.name} listening on ${server.url}`);
  console.log('🤖 Bot listo para recibir mensajes');
  console.log(`📍 Endpoint: ${server.url}/api/messages`);
  console.log('\n🔧 Configuración:');
  console.log(`   Bot ID: ${config.MicrosoftAppId ? '✓' : '✗'}`);
  console.log(`   Tenant ID: ${config.MicrosoftAppTenantId ? '✓' : '✗'}`);
  console.log(`   App Type: ${config.MicrosoftAppType || 'MultiTenant'}`);
});

// Configurar autenticación del bot
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: config.MicrosoftAppId,
  MicrosoftAppPassword: config.MicrosoftAppPassword,
  MicrosoftAppType: config.MicrosoftAppType,
  MicrosoftAppTenantId: config.MicrosoftAppTenantId,
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
  {},
  credentialsFactory
);

// Crear adaptador
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Manejo de errores
adapter.onTurnError = async (context: TurnContext, error: Error) => {
  console.error(`\n❌ [onTurnError] Error: ${error.message}`);
  console.error(error.stack);

  try {
    await context.sendActivity("❌ El bot encontró un error. Por favor intenta de nuevo.");
    await context.sendActivity(`Detalles del error: ${error.message}`);
  } catch (sendError) {
    console.error("Error al enviar mensaje de error:", sendError);
  }
};

// Crear instancia del bot
const bot = new TeamsBot();

// Endpoint para mensajes
server.post("/api/messages", async (req, res) => {
  try {
    await adapter.process(req, res, (context) => bot.run(context));
  } catch (error) {
    console.error("Error procesando mensaje:", error);
    res.send(500);
  }
});

// Endpoint de salud
server.get("/health", (req, res, next) => {
  res.send(200, { 
    status: "healthy",
    timestamp: new Date().toISOString(),
    config: {
      hasAppId: !!config.MicrosoftAppId,
      hasTenantId: !!config.MicrosoftAppTenantId,
      appType: config.MicrosoftAppType
    }
  });
  next();
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n⚠️ Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

console.log('\n🚀 Iniciando servidor...');