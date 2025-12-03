process.env.RESEND_API_KEY = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test';
import { EmailService } from '@/lib/services/emailService';
import { supabase } from '@/lib/supabase';

// Mock Resend
const mockSend = jest.fn().mockResolvedValue({ id: 'test-email-id' });
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('checkUserPreferences', () => {
    it('should return shouldSend=true when no preferences exist', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // Access private method for testing
      const result = await (EmailService as any).checkUserPreferences(
        'user-123',
        'new_lead'
      );

      expect(result).toEqual({ shouldSend: true, useDaily: false });
    });

    it('should filter by specialty when configured', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                email_new_lead: true,
                especialidades_interes: ['Civil', 'Penal'],
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await (EmailService as any).checkUserPreferences(
        'user-123',
        'new_lead',
        {
          especialidad: 'Laboral',
          precio: 100,
          urgencia: 'alta',
        }
      );

      expect(result).toEqual({ shouldSend: false, useDaily: false });
    });

    it('should filter by price range', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                email_new_lead: true,
                precio_min: 50,
                precio_max: 150,
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const resultTooLow = await (EmailService as any).checkUserPreferences(
        'user-123',
        'new_lead',
        {
          especialidad: 'Civil',
          precio: 30,
          urgencia: 'alta',
        }
      );

      expect(resultTooLow).toEqual({ shouldSend: false, useDaily: false });

      const resultTooHigh = await (EmailService as any).checkUserPreferences(
        'user-123',
        'new_lead',
        {
          especialidad: 'Civil',
          precio: 200,
          urgencia: 'alta',
        }
      );

      expect(resultTooHigh).toEqual({ shouldSend: false, useDaily: false });
    });

    it('should return useDaily=true when resumen_diario is enabled', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                email_new_lead: true,
                resumen_diario: true,
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await (EmailService as any).checkUserPreferences(
        'user-123',
        'new_lead',
        {
          especialidad: 'Civil',
          precio: 100,
          urgencia: 'alta',
        }
      );

      expect(result).toEqual({ shouldSend: false, useDaily: true });
    });

    it('should filter by urgency when solo_alta_urgencia is true', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                email_new_lead: true,
                solo_alta_urgencia: true,
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const resultBaja = await (EmailService as any).checkUserPreferences(
        'user-123',
        'new_lead',
        {
          especialidad: 'Civil',
          precio: 100,
          urgencia: 'baja',
        }
      );

      expect(resultBaja).toEqual({ shouldSend: false, useDaily: false });

      const resultAlta = await (EmailService as any).checkUserPreferences(
        'user-123',
        'new_lead',
        {
          especialidad: 'Civil',
          precio: 100,
          urgencia: 'alta',
        }
      );

      expect(resultAlta).toEqual({ shouldSend: true, useDaily: false });
    });
  });

  describe('sendNewLeadAvailable', () => {
    it('should not send email when user preferences block it', async () => {
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'user_notification_preferences') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    email_new_lead: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: jest.fn() };
      });

      await EmailService.sendNewLeadAvailable('user-123', {
        id: 'lead-123',
        especialidad: 'Civil',
        urgencia: 'alta',
        puntuacion_calidad: 85,
        precio: 100,
      });

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should send email when preferences allow it', async () => {
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'user_notification_preferences') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    email_new_lead: true,
                    user_id: 'user-123',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { email: 'test@example.com' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: jest.fn() };
      });

      await EmailService.sendNewLeadAvailable('user-123', {
        id: 'lead-123',
        especialidad: 'Civil',
        urgencia: 'alta',
        puntuacion_calidad: 85,
        precio: 100,
      });

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('sendSolicitudApproved', () => {
    it('should send approval email', async () => {
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'user_notification_preferences') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    email_solicitud_status: true,
                    user_id: 'user-123',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { email: 'test@example.com' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: jest.fn() };
      });

      await EmailService.sendSolicitudApproved('user-123', 'Test Despacho');

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('sendDailySummaries', () => {
    it('should process summaries for eligible users', async () => {
      const currentHour = new Date().getHours();
      const mockUsers = [
        { user_id: 'user-1', hora_resumen: `${currentHour}:00` },
      ];

      const mockPendingLeads = [
        {
          id: 'notif-1',
          lead_id: 'lead-1',
          leads: {
            id: 'lead-1',
            especialidad: 'Civil',
            urgencia: 'alta',
            puntuacion_calidad: 90,
            precio: 100,
          },
        },
      ];

      const mockUserData = { email: 'user@example.com' };

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'user_notification_preferences') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockUsers,
                error: null,
              }),
            }),
          };
        }
        if (table === 'pending_daily_notifications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockPendingLeads,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUserData,
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: jest.fn() };
      });

      const result = await EmailService.sendDailySummaries();

      expect(result.success).toBe(true);
      expect(result.processed).toHaveLength(1);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should skip users with no pending notifications', async () => {
      const currentHour = new Date().getHours();
      const mockUsers = [
        { user_id: 'user-2', hora_resumen: `${currentHour}:00` },
      ];

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'user_notification_preferences') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockUsers,
                error: null,
              }),
            }),
          };
        }
        if (table === 'pending_daily_notifications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [], // No pending notifications
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: jest.fn() };
      });

      const result = await EmailService.sendDailySummaries();

      expect(result.success).toBe(true);
      expect(result.processed).toHaveLength(0);
    });
  });
});
