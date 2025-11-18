import { TurnContext, CardFactory } from "botbuilder";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { ChartConfiguration } from "chart.js";

/**
 * Genera una gráfica y la envía como imagen en un Adaptive Card
 */
export async function sendChart(context: TurnContext, chartType: 'bar' | 'line' | 'pie' = 'bar') {
  try {
    const width = 800;
    const height = 600;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
      width, 
      height,
      backgroundColour: 'white'
    });

    const configuration = getChartConfiguration(chartType);
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = imageBuffer.toString('base64');

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
          text: getChartDescription(chartType),
          spacing: "None",
          isSubtle: true,
          wrap: true
        },
        {
          type: "Image",
          url: `data:image/png;base64,${base64Image}`,
          size: "Stretch",
          altText: `Gráfica de tipo ${chartType}`
        },
        {
          type: "TextBlock",
          text: "💡 **Datos mostrados:**",
          weight: "Bolder",
          spacing: "Medium"
        },
        {
          type: "TextBlock",
          text: getDataSummary(chartType),
          wrap: true,
          spacing: "Small"
        }
      ],
      actions: [
        {
          type: "Action.Submit",
          title: "🔄 Ver otra gráfica",
          data: { action: "show_charts_menu" }
        }
      ]
    });

    await context.sendActivity({ attachments: [card] });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error("❌ Error generando gráfica:", errorMessage);
    await context.sendActivity(`⚠️ Error al generar la gráfica: ${errorMessage}`);
  }
}

function getChartConfiguration(type: 'bar' | 'line' | 'pie'): ChartConfiguration {
  const labels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
  const data = [65, 59, 80, 81, 56, 55];

  switch (type) {
    case 'bar':
      return {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Ventas (Miles)',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Miles de pesos'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Mes'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Ventas Mensuales 2024',
              font: {
                size: 18,
                weight: 'bold'
              }
            },
            legend: {
              display: true,
              position: 'top'
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
            label: 'Crecimiento',
            data: data,
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: 'rgb(75, 192, 192)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Tendencia de Crecimiento',
              font: {
                size: 18,
                weight: 'bold'
              }
            },
            legend: {
              display: true
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Unidades'
              }
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
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Distribución por Producto',
              font: {
                size: 18,
                weight: 'bold'
              }
            },
            legend: {
              display: true,
              position: 'right'
            }
          }
        }
      };
  }
}

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
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
      width, 
      height,
      backgroundColour: 'white'
    });

    const configuration: ChartConfiguration = {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          label: title,
          data: data,
          backgroundColor: type === 'pie' 
            ? data.map((_, i) => `hsla(${i * 60}, 70%, 60%, 0.7)`)
            : 'rgba(54, 162, 235, 0.7)',
          borderColor: type === 'pie'
            ? data.map((_, i) => `hsla(${i * 60}, 70%, 50%, 1)`)
            : 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: type === 'pie' ? 'right' : 'top'
          }
        },
        scales: type !== 'pie' ? {
          y: {
            beginAtZero: true
          }
        } : undefined
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
          size: "Large",
          wrap: true
        },
        {
          type: "Image",
          url: `data:image/png;base64,${base64Image}`,
          size: "Stretch",
          altText: title
        },
        {
          type: "FactSet",
          facts: labels.map((label, index) => ({
            title: label,
            value: data[index].toLocaleString('es-ES')
          }))
        }
      ]
    });

    await context.sendActivity({ attachments: [card] });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error("❌ Error generando gráfica personalizada:", errorMessage);
    await context.sendActivity(`⚠️ Error al generar la gráfica: ${errorMessage}`);
  }
}

function getChartDescription(type: string): string {
  switch (type) {
    case 'bar':
      return 'Gráfica de barras - Ideal para comparar valores entre categorías';
    case 'line':
      return 'Gráfica de líneas - Perfecta para mostrar tendencias a lo largo del tiempo';
    case 'pie':
      return 'Gráfica circular - Muestra la distribución porcentual de datos';
    default:
      return 'Visualización de datos';
  }
}

function getDataSummary(type: string): string {
  switch (type) {
    case 'bar':
      return 'Ventas mensuales del primer semestre. Total: $416,000';
    case 'line':
      return 'Tendencia de crecimiento con promedio de 70.17 unidades';
    case 'pie':
      return 'Producto B lidera con 50% de participación';
    default:
      return 'Datos de ejemplo';
  }
}