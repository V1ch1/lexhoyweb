// Servicio para Google Analytics Data API
import { BetaAnalyticsDataClient } from '@google-analytics/data';

interface AnalyticsMetrics {
  visitors: { today: number; week: number; month: number };
  sessions: { today: number; week: number; month: number };
  pageviews: { today: number; week: number; month: number };
  bounceRate: number;
  avgSessionDuration: number;
}

interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
}

interface PopularPage {
  path: string;
  title: string;
  pageviews: number;
  avgTime: number;
}

export class GoogleAnalyticsService {
  private client: BetaAnalyticsDataClient;
  private propertyId: string;

  constructor() {
    // Usar archivo de credenciales JSON
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
      './google-credentials.json';

    this.client = new BetaAnalyticsDataClient({
      keyFilename,
    });

    this.propertyId = `properties/${process.env.GOOGLE_ANALYTICS_PROPERTY_ID}`;
  }

  /**
   * Obtener métricas generales
   */
  async getOverviewMetrics(days: number = 30): Promise<AnalyticsMetrics> {
    const endDate = 'today';
    const startDate = `${days}daysAgo`;

    const [todayResponse, weekResponse, customResponse] = await Promise.all([
      this.runReport('today', 'today'),
      this.runReport('7daysAgo', 'today'),
      this.runReport(startDate, endDate),
    ]);

    return {
      visitors: {
        today: this.extractMetric(todayResponse, 'activeUsers'),
        week: this.extractMetric(weekResponse, 'activeUsers'),
        month: this.extractMetric(customResponse, 'activeUsers'),
      },
      sessions: {
        today: this.extractMetric(todayResponse, 'sessions'),
        week: this.extractMetric(weekResponse, 'sessions'),
        month: this.extractMetric(customResponse, 'sessions'),
      },
      pageviews: {
        today: this.extractMetric(todayResponse, 'screenPageViews'),
        week: this.extractMetric(weekResponse, 'screenPageViews'),
        month: this.extractMetric(customResponse, 'screenPageViews'),
      },
      bounceRate: this.extractMetric(customResponse, 'bounceRate'),
      avgSessionDuration: this.extractMetric(customResponse, 'averageSessionDuration'),
    };
  }

  /**
   * Obtener fuentes de tráfico
   */
  async getTrafficSources(days: number = 30): Promise<TrafficSource[]> {
    const [response] = await this.client.runReport({
      property: this.propertyId,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    });

    const totalSessions = response.rows?.reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'),
      0
    ) || 1;

    return (
      response.rows?.map((row) => {
        const sessions = parseInt(row.metricValues?.[0]?.value || '0');
        return {
          source: row.dimensionValues?.[0]?.value || 'Unknown',
          sessions,
          percentage: Math.round((sessions / totalSessions) * 100),
        };
      }) || []
    );
  }

  /**
   * Obtener páginas más populares
   */
  async getPopularPages(days: number = 30): Promise<PopularPage[]> {
    const [response] = await this.client.runReport({
      property: this.propertyId,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });

    return (
      response.rows?.map((row) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        title: row.dimensionValues?.[1]?.value || 'Sin título',
        pageviews: parseInt(row.metricValues?.[0]?.value || '0'),
        avgTime: parseInt(row.metricValues?.[1]?.value || '0'),
      })) || []
    );
  }

  /**
   * Ejecutar reporte básico
   */
  private async runReport(startDate: string, endDate: string) {
    const [response] = await this.client.runReport({
      property: this.propertyId,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
    });

    return response;
  }

  /**
   * Extraer métrica del response
   */
  private extractMetric(response: any, metricName: string): number {
    const metricIndex = response.metricHeaders?.findIndex(
      (h: any) => h.name === metricName
    );

    if (metricIndex === -1 || !response.rows?.[0]) return 0;

    const value = response.rows[0].metricValues?.[metricIndex]?.value || '0';
    return parseFloat(value);
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService();
