import { TeamsActivityHandler, TurnContext } from "botbuilder";
import { userInfo } from "./src/features/userInfo";
import { sendChart, sendCustomChart } from "./src/features/sentCharts";
import { withTypingIndicator } from "./src/features/typingIndicator";

export class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      const text = context.activity.text?.trim().toLowerCase() || "";
      
      console.log(`📨 Mensaje recibido: "${text}"`);

      // Gráficas - con indicador de typing
      if (text.includes("grafica") || text.includes("gráfica") || text.includes("chart")) {
        await withTypingIndicator(context, async () => {
          if (text.includes("barra") || text.includes("bar")) {
            await context.sendActivity("📊 Generando gráfica de barras...");
            await sendChart(context, 'bar');
            return;
          }
          
          if (text.includes("linea") || text.includes("línea") || text.includes("line") || text.includes("tendencia")) {
            await context.sendActivity("📈 Generando gráfica de líneas...");
            await sendChart(context, 'line');
            return;
          }
          
          if (text.includes("pastel") || text.includes("pie") || text.includes("dona") || text.includes("circular")) {
            await context.sendActivity("🥧 Generando gráfica circular...");
            await sendChart(context, 'pie');
            return;
          }

          // Gráfica genérica (por defecto barras)
          await context.sendActivity("📊 Generando gráfica...");
          await sendChart(context, 'bar');
        });
        
        await next();
        return;
      }

      // Ejemplo de gráfica personalizada con typing
      if (text.includes("ventas") && text.includes("año")) {
        await withTypingIndicator(context, async () => {
          await context.sendActivity("📊 Generando reporte de ventas anuales...");
          await sendCustomChart(
            context,
            ['Q1', 'Q2', 'Q3', 'Q4'],
            [125000, 145000, 160000, 180000],
            'Ventas por Trimestre 2024',
            'bar'
          );
        });
        
        await next();
        return;
      }

      // Comparativa con typing
      if (text.includes("comparativa") || text.includes("comparar")) {
        await withTypingIndicator(context, async () => {
          await context.sendActivity("📊 Generando comparativa...");
          await sendCustomChart(
            context,
            ['Producto A', 'Producto B', 'Producto C', 'Producto D', 'Producto E'],
            [45, 32, 28, 15, 10],
            'Distribución de Ventas por Producto',
            'pie'
          );
        });
        
        await next();
        return;
      }

      // Info de usuario con typing (puede tardar por la llamada a Graph API)
      if (text === "info" || text === "/info" || text.includes("cuenta") || text.includes("credenciales")) {
        await withTypingIndicator(context, async () => {
          await userInfo(context);
        });
        
        await next();
        return;
      }

      // Reset - sin typing necesario
      if (text === "/reset") {
        await context.sendActivity("🔄 Conversación reiniciada.");
        await next();
        return;
      }

      // Ayuda - sin typing necesario
      if (text === "ayuda" || text === "help" || text === "/help") {
        const helpMessage = `🤖 **GuruTeam Bot - Comandos Disponibles**

📊 **Gráficas:**
• \`grafica\` o \`gráfica\` - Gráfica de barras
• \`grafica linea\` o \`tendencia\` - Gráfica de líneas
• \`grafica pastel\` o \`circular\` - Gráfica circular
• \`ventas año\` - Reporte de ventas anuales
• \`comparativa\` - Comparativa de productos

👤 **Información:**
• \`info\` - Ver tu información de usuario

🔧 **Utilidades:**
• \`ayuda\` o \`help\` - Mostrar esta ayuda
• \`/reset\` - Reiniciar conversación

💡 **Ejemplos:**
• "muestra una gráfica de barras"
• "quiero ver la tendencia"
• "genera una comparativa"
• "ventas del año"

⏳ **Nota:** El bot mostrará "escribiendo..." mientras procesa tus solicitudes.`;

        await context.sendActivity(helpMessage);
        await next();
        return;
      }

      // Saludo - sin typing necesario
      if (text === "hi" || text === "hello" || text === "hola") {
        await context.sendActivity(`¡Hola! 👋 Soy GuruTeam Bot.

Puedo ayudarte con:
📊 Generar gráficas interactivas
📈 Visualizar datos y tendencias
👤 Consultar información de usuarios

Escribe **ayuda** para ver todos los comandos disponibles.`);
        await next();
        return;
      }

      // Mensaje por defecto
      await context.sendActivity(`Recibí: "${context.activity.text}"

💡 Prueba comandos como:
• "grafica" - para ver gráficas
• "ayuda" - para ver todos los comandos`);
      await next();
    });
  }
}

export default TeamsBot;