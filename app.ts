import { TeamsActivityHandler, TurnContext } from "botbuilder";
import { userInfo } from "./src/features/userInfo";

export class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      const text = context.activity.text?.trim().toLowerCase() || "";
      
      console.log(`📨 Mensaje recibido: "${text}"`);

      // Comando para ver info del usuario
      if (text === "info" || text === "/info" || text.includes("cuenta") || text.includes("credenciales")) {
        await userInfo(context);
        await next();
        return;
      }

      // Comando de reset
      if (text === "/reset") {
        await context.sendActivity("🔄 Conversación reiniciada.");
        await next();
        return;
      }

      // Saludo
      if (text === "hi" || text === "hello" || text === "hola") {
        await context.sendActivity(`¡Hola! 👋 Soy GuruTeam Bot.

Comandos disponibles:
- **info**: Ver tu información de usuario
- **/reset**: Reiniciar conversación`);
        await next();
        return;
      }

      // Respuesta por defecto
      await context.sendActivity(`Recibí: "${context.activity.text}"`);
      await next();
    });
  }
}

export default TeamsBot;