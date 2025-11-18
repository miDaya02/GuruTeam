import { TurnContext, CardFactory, Attachment } from "botbuilder";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

/**
 * Genera una gráfica y la envía como imagen en un Adaptive Card
 */
export async function sendChart(context: TurnContext, chartType: 'bar' | 'line' | 'pie' = 'bar') {
  try {
    console.log(`📊 Generando gráfica tipo: ${chartType}`);

    // Configurar el canvas para Chart.js
    const width = 800;
    const height = 600;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    // Datos de ejemplo (puedes cambiarlos por datos reales)
    const configuration = getChartConfiguration(chartType);

    // Generar la imagen
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = imageBuffer.toString('base64');

    // Crear Adaptive Card con la imagen
    const card = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "📊 Gráfica de Datos",
          weight: "Bolder",
          size: "Large"
        },
        {
          type: "TextBlock",
          text: `Tipo: ${chartType.toUpperCase()}`,
          spacing: "None",
          isSubtle: true
        },
        {
          type: "Image",
          url: `data:image/png;base64,${base64Image}`,
          size: "Large"
        }
      ],
      actions: [
        {
          type: "Action.Submit",
          title: "Actualizar datos",
          data: { action: "refresh_chart" }
        }
      ]
    });

    await context.sendActivity({ attachments: [card] });
    console.log("✅ Gráfica enviada");

  } catch (error: any) {
    console.error("❌ Error generando gráfica:", error.message);
    await context.sendActivity("⚠️ No se pudo generar la gráfica.");
  }
}

/**
 * Genera configuración de Chart.js según el tipo
 */
function getChartConfiguration(type: 'bar' | 'line' | 'pie') {
  const labels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
  const data = [65, 59, 80, 81, 56, 55];

  switch (type) {
    case 'bar':
      return {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Ventas 2024',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Ventas Mensuales'
            }
          }
        }
      };

    case 'line':
      return {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Progreso',
            data: data,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Tendencia Mensual'
            }
          }
        }
      };

    case 'pie':
      return {
        type: 'pie',
        data: {
          labels: ['Producto A', 'Producto B', 'Producto C', 'Producto D'],
          datasets: [{
            label: 'Distribución',
            data: [30, 50, 15, 5],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)'
            ]
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución por Producto'
            }
          }
        }
      };
  }
}

/**
 * Envía una gráfica con datos personalizados
 */
export async function sendCustomChart(
  context: TurnContext, 
  labels: string[], 
  data: number[], 
  title: string,
  type: 'bar' | 'line' | 'pie' = 'bar'
) {
  try {
    const width = 800;
    const height = 600;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration: any = {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          label: title,
          data: data,
          backgroundColor: type === 'pie' 
            ? data.map((_, i) => `hsla(${i * 60}, 70%, 60%, 0.5)`)
            : 'rgba(54, 162, 235, 0.5)',
          borderColor: type === 'pie'
            ? data.map((_, i) => `hsla(${i * 60}, 70%, 50%, 1)`)
            : 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: title
          }
        }
      }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = imageBuffer.toString('base64');

    const card = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: title,
          weight: "Bolder",
          size: "Large"
        },
        {
          type: "Image",
          url: `data:image/png;base64,${base64Image}`,
          size: "Large"
        }
      ]
    });

    await context.sendActivity({ attachments: [card] });

  } catch (error: any) {
    console.error("❌ Error generando gráfica personalizada:", error.message);
    await context.sendActivity("⚠️ No se pudo generar la gráfica.");
  }
}