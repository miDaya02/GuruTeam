import { TurnContext, CardFactory } from "botbuilder";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { ChartConfiguration } from "chart.js";

/**
 * Paleta de colores siguiendo Microsoft Fluent Design
 */
const MICROSOFT_COLORS = {
  primary: {
    blue: 'rgba(0, 120, 212, 0.8)',
    blueBorder: 'rgba(0, 120, 212, 1)',
    blueLight: 'rgba(0, 120, 212, 0.2)',
  },
  secondary: {
    teal: 'rgba(0, 183, 195, 0.8)',
    tealBorder: 'rgba(0, 183, 195, 1)',
    purple: 'rgba(136, 23, 152, 0.8)',
    purpleBorder: 'rgba(136, 23, 152, 1)',
    orange: 'rgba(247, 99, 12, 0.8)',
    orangeBorder: 'rgba(247, 99, 12, 1)',
    green: 'rgba(16, 124, 16, 0.8)',
    greenBorder: 'rgba(16, 124, 16, 1)',
  },
  chart: [
    'rgba(0, 120, 212, 0.85)',    // Blue
    'rgba(0, 183, 195, 0.85)',    // Teal
    'rgba(136, 23, 152, 0.85)',   // Purple
    'rgba(247, 99, 12, 0.85)',    // Orange
    'rgba(16, 124, 16, 0.85)',    // Green
    'rgba(232, 17, 35, 0.85)',    // Red
  ],
  chartBorder: [
    'rgba(0, 120, 212, 1)',
    'rgba(0, 183, 195, 1)',
    'rgba(136, 23, 152, 1)',
    'rgba(247, 99, 12, 1)',
    'rgba(16, 124, 16, 1)',
    'rgba(232, 17, 35, 1)',
  ]
};

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
          type: "Container",
          style: "emphasis",
          items: [
            {
              type: "TextBlock",
              text: getChartTitle(chartType),
              weight: "Bolder",
              size: "Large",
              color: "Accent"
            },
            {
              type: "TextBlock",
              text: getChartDescription(chartType),
              spacing: "None",
              isSubtle: true,
              wrap: true,
              size: "Small"
            }
          ],
          bleed: true
        },
        {
          type: "Image",
          url: `data:image/png;base64,${base64Image}`,
          size: "Stretch",
          altText: `Gráfica de tipo ${chartType}`,
          spacing: "Medium"
        },
        ...(chartType === 'pie' ? getPieChartTable() : []),
        {
          type: "Container",
          spacing: "Medium",
          style: "emphasis",
          items: [
            {
              type: "TextBlock",
              text: "📊 Resumen de datos",
              weight: "Bolder",
              size: "Medium"
            },
            {
              type: "TextBlock",
              text: getDataSummary(chartType),
              wrap: true,
              spacing: "Small"
            }
          ]
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
            label: 'Ventas (Miles $)',
            data: data,
            backgroundColor: MICROSOFT_COLORS.primary.blue,
            borderColor: MICROSOFT_COLORS.primary.blueBorder,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Ventas Mensuales 2024',
              font: {
                size: 24,
                weight: 'bold',
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              },
              padding: {
                top: 10,
                bottom: 20
              },
              color: '#323130'
            },
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: {
                  size: 14,
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                },
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                lineWidth: 1
              },
              ticks: {
                font: {
                  size: 12,
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                },
                callback: function(value) {
                  return '$' + value + 'K';
                }
              },
              title: {
                display: true,
                text: 'Miles de pesos',
                font: {
                  size: 14,
                  weight: 'bold',
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 12,
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }
              },
              title: {
                display: true,
                text: 'Mes',
                font: {
                  size: 14,
                  weight: 'bold',
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }
              }
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
            label: 'Tendencia de Crecimiento',
            data: data,
            fill: true,
            backgroundColor: MICROSOFT_COLORS.primary.blueLight,
            borderColor: MICROSOFT_COLORS.primary.blueBorder,
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: MICROSOFT_COLORS.primary.blueBorder,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: MICROSOFT_COLORS.primary.blueBorder,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Tendencia de Crecimiento 2024',
              font: {
                size: 24,
                weight: 'bold',
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              },
              padding: {
                top: 10,
                bottom: 20
              },
              color: '#323130'
            },
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: {
                  size: 14,
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                },
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                lineWidth: 1
              },
              ticks: {
                font: {
                  size: 12,
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }
              },
              title: {
                display: true,
                text: 'Unidades',
                font: {
                  size: 14,
                  weight: 'bold',
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 12,
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }
              }
            }
          }
        }
      };

    case 'pie':
      return {
        type: 'pie',
        data: {
          labels: ['Nómina', 'Servicios', 'Proveedores', 'Impuestos', 'Otros'],
          datasets: [{
            label: 'Distribución de Pagos',
            data: [45, 20, 18, 12, 5],
            backgroundColor: MICROSOFT_COLORS.chart,
            borderColor: MICROSOFT_COLORS.chartBorder,
            borderWidth: 2,
            hoverOffset: 15,
            hoverBorderWidth: 3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Pagos - Noviembre 2024',
              font: {
                size: 24,
                weight: 'bold',
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              },
              padding: {
                top: 10,
                bottom: 20
              },
              color: '#323130'
            },
            legend: {
              display: true,
              position: 'right',
              labels: {
                font: {
                  size: 13,
                  family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                },
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle',
                generateLabels: function(chart) {
                  const data = chart.data;
                  if (data.labels && data.datasets.length) {
                    const dataset = data.datasets[0];
                    const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
                    return data.labels.map((label, i) => {
                      const value = (dataset.data as number[])[i];
                      const percentage = ((value / total) * 100).toFixed(1);
                      return {
                        text: `${label}: ${percentage}%`,
                        fillStyle: (dataset.backgroundColor as string[])[i],
                        hidden: false,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: $${value}K (${percentage}%)`;
                }
              }
            }
          }
        }
      };
  }
}

function getPieChartTable() {
  // Datos de ejemplo de pagos
  const paymentData = [
    { category: 'Nómina', amount: 45, percentage: 45, lastPayment: '15/11/2024', status: '✅' },
    { category: 'Servicios', amount: 20, percentage: 20, lastPayment: '10/11/2024', status: '✅' },
    { category: 'Proveedores', amount: 18, percentage: 18, lastPayment: '12/11/2024', status: '✅' },
    { category: 'Impuestos', amount: 12, percentage: 12, lastPayment: '05/11/2024', status: '✅' },
    { category: 'Otros', amount: 5, percentage: 5, lastPayment: '08/11/2024', status: '✅' }
  ];

  return [
    {
      type: "Container",
      spacing: "Medium",
      separator: true,
      items: [
        {
          type: "TextBlock",
          text: "💰 Detalle de Pagos",
          weight: "Bolder",
          size: "Medium",
          spacing: "Small"
        },
        {
          type: "Table",
          gridStyle: "accent",
          firstRowAsHeader: true,
          columns: [
            { width: 2 },
            { width: 1 },
            { width: 1 },
            { width: 1 },
            { width: 1 }
          ],
          rows: [
            {
              type: "TableRow",
              cells: [
                { type: "TableCell", items: [{ type: "TextBlock", text: "Categoría", weight: "Bolder", size: "Small" }] },
                { type: "TableCell", items: [{ type: "TextBlock", text: "Monto", weight: "Bolder", size: "Small" }] },
                { type: "TableCell", items: [{ type: "TextBlock", text: "%", weight: "Bolder", size: "Small" }] },
                { type: "TableCell", items: [{ type: "TextBlock", text: "Último Pago", weight: "Bolder", size: "Small" }] },
                { type: "TableCell", items: [{ type: "TextBlock", text: "Estado", weight: "Bolder", size: "Small" }] }
              ]
            },
            ...paymentData.map(item => ({
              type: "TableRow",
              cells: [
                { type: "TableCell", items: [{ type: "TextBlock", text: item.category, size: "Small" }] },
                { type: "TableCell", items: [{ type: "TextBlock", text: `$${item.amount}K`, size: "Small", weight: "Bolder" }] },
                { type: "TableCell", items: [{ type: "TextBlock", text: `${item.percentage}%`, size: "Small" }] },
                { type: "TableCell", items: [{ type: "TextBlock", text: item.lastPayment, size: "Small" }] },
                { type: "TableCell", items: [{ type: "TextBlock", text: item.status, size: "Small" }] }
              ]
            }))
          ]
        },
        {
          type: "TextBlock",
          text: "**Total:** $100K",
          weight: "Bolder",
          size: "Medium",
          horizontalAlignment: "Right",
          spacing: "Small"
        }
      ]
    }
  ];
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
            ? MICROSOFT_COLORS.chart.slice(0, data.length)
            : MICROSOFT_COLORS.primary.blue,
          borderColor: type === 'pie'
            ? MICROSOFT_COLORS.chartBorder.slice(0, data.length)
            : MICROSOFT_COLORS.primary.blueBorder,
          borderWidth: 2,
          ...(type === 'bar' && {
            borderRadius: 8,
            borderSkipped: false,
          }),
          ...(type === 'pie' && {
            hoverOffset: 15,
            hoverBorderWidth: 3
          })
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: 24,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: {
              top: 10,
              bottom: 20
            },
            color: '#323130'
          },
          legend: {
            display: true,
            position: type === 'pie' ? 'right' : 'top',
            labels: {
              font: {
                size: 14,
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        scales: type !== 'pie' ? {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              lineWidth: 1
            },
            ticks: {
              font: {
                size: 12,
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }
            }
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
          type: "Container",
          style: "emphasis",
          items: [
            {
              type: "TextBlock",
              text: title,
              weight: "Bolder",
              size: "Large",
              wrap: true,
              color: "Accent"
            }
          ],
          bleed: true
        },
        {
          type: "Image",
          url: `data:image/png;base64,${base64Image}`,
          size: "Stretch",
          altText: title,
          spacing: "Medium"
        },
        {
          type: "Container",
          spacing: "Medium",
          style: "emphasis",
          items: [
            {
              type: "TextBlock",
              text: "📊 Datos",
              weight: "Bolder",
              size: "Medium"
            },
            {
              type: "FactSet",
              facts: labels.map((label, index) => ({
                title: label,
                value: data[index].toLocaleString('es-ES')
              }))
            }
          ]
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

function getChartTitle(type: string): string {
  switch (type) {
    case 'bar':
      return '📊 Gráfica de Barras';
    case 'line':
      return '📈 Gráfica de Tendencia';
    case 'pie':
      return '🥧 Distribución de Pagos';
    default:
      return '📊 Visualización de Datos';
  }
}

function getChartDescription(type: string): string {
  switch (type) {
    case 'bar':
      return 'Comparación de valores mensuales - Ideal para análisis de ventas';
    case 'line':
      return 'Visualización de tendencias a lo largo del tiempo';
    case 'pie':
      return 'Distribución porcentual de pagos por categoría';
    default:
      return 'Visualización de datos';
  }
}

function getDataSummary(type: string): string {
  switch (type) {
    case 'bar':
      return '📈 **Total semestral:** $416,000 | **Promedio mensual:** $69,333 | **Mejor mes:** Abril ($81K)';
    case 'line':
      return '📊 **Promedio:** 70.17 unidades | **Tendencia:** Positiva | **Máximo:** 81 unidades';
    case 'pie':
      return '💰 **Total mensual:** $100K | **Mayor categoría:** Nómina (45%) | **Todos los pagos al día**';
    default:
      return 'Datos de ejemplo para visualización';
  }
}