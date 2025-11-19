import { TurnContext } from "botbuilder";

/**
 * Clase para controlar el estado de procesamiento del bot
 * y evitar mensajes duplicados mientras procesa
 */
class BotProcessingManager {
  private processingUsers: Set<string> = new Set();
  private typingIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Verifica si el bot está procesando un mensaje de este usuario
   */
  isProcessing(userId: string): boolean {
    return this.processingUsers.has(userId);
  }

  /**
   * Marca que el bot está procesando un mensaje de este usuario
   */
  startProcessing(userId: string): void {
    this.processingUsers.add(userId);
  }

  /**
   * Marca que el bot terminó de procesar
   */
  endProcessing(userId: string): void {
    this.processingUsers.delete(userId);
    this.stopTypingIndicator(userId);
  }

  /**
   * Inicia el indicador de "escribiendo" que se envía cada 3 segundos
   * (Teams requiere que se reenvíe periódicamente)
   */
  async startTypingIndicator(context: TurnContext): Promise<void> {
    const userId = context.activity.from.id;
    
    // Si ya hay un indicador activo, no crear otro
    if (this.typingIntervals.has(userId)) {
      return;
    }

    // Enviar el primer indicador inmediatamente
    await this.sendTypingIndicator(context);

    // Configurar envío periódico cada 3 segundos
    const interval = setInterval(async () => {
      try {
        await this.sendTypingIndicator(context);
      } catch (error) {
        console.error("Error enviando typing indicator:", error);
        this.stopTypingIndicator(userId);
      }
    }, 3000);

    this.typingIntervals.set(userId, interval);
  }

  /**
   * Detiene el indicador de "escribiendo"
   */
  stopTypingIndicator(userId: string): void {
    const interval = this.typingIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.typingIntervals.delete(userId);
    }
  }

  /**
   * Envía una actividad de tipo "typing" a Teams
   */
  private async sendTypingIndicator(context: TurnContext): Promise<void> {
    await context.sendActivity({ type: 'typing' });
  }

  /**
   * Limpia todos los estados de procesamiento (útil para reiniciar)
   */
  cleanup(): void {
    this.processingUsers.clear();
    this.typingIntervals.forEach((interval) => clearInterval(interval));
    this.typingIntervals.clear();
  }
}

// Instancia singleton del manager
export const processingManager = new BotProcessingManager();

/**
 * Wrapper para ejecutar código con indicador de typing y protección contra duplicados
 * 
 * @example
 * await withTypingIndicator(context, async () => {
 *   await sendChart(context, 'bar');
 * });
 */
export async function withTypingIndicator<T>(
  context: TurnContext,
  handler: () => Promise<T>
): Promise<T | null> {
  const userId = context.activity.from.id;

  // Verificar si ya está procesando
  if (processingManager.isProcessing(userId)) {
    console.log(`⏳ Usuario ${userId} ya tiene un mensaje en proceso`);
    await context.sendActivity("⏳ Por favor espera, estoy procesando tu solicitud anterior...");
    return null;
  }

  try {
    // Marcar como procesando
    processingManager.startProcessing(userId);
    
    // Iniciar indicador de typing
    await processingManager.startTypingIndicator(context);
    
    console.log(`✍️ Indicador de typing iniciado para usuario ${userId}`);

    // Ejecutar la función del handler
    const result = await handler();
    
    console.log(`✅ Procesamiento completado para usuario ${userId}`);
    return result;

  } catch (error) {
    console.error(`❌ Error en procesamiento para usuario ${userId}:`, error);
    throw error;
  } finally {
    // Siempre limpiar el estado, incluso si hay error
    processingManager.endProcessing(userId);
    console.log(`🏁 Estado limpiado para usuario ${userId}`);
  }
}

/**
 * Función auxiliar para mostrar mensaje de espera con tiempo estimado
 */
export async function sendProcessingMessage(
  context: TurnContext,
  estimatedTime: number = 5
): Promise<void> {
  await context.sendActivity(
    `⏳ Procesando tu solicitud... Tiempo estimado: ~${estimatedTime} segundos`
  );
}

/**
 * Función para limpiar todos los estados (útil para debugging o reinicio)
 */
export function cleanupAllProcessing(): void {
  processingManager.cleanup();
  console.log("🧹 Todos los estados de procesamiento limpiados");
}