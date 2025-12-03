import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationBell } from '@/components/NotificationBell';
import { NotificationService } from '@/lib/notificationService';

// Mock del NotificationService
jest.mock('@/lib/notificationService', () => ({
  NotificationService: {
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn()
  }
}));

// Mock de Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, onClick }: any) => {
    return <a href={href} onClick={onClick}>{children}</a>;
  };
});

describe('NotificationBell Component', () => {
  const mockUserId = 'user-123';
  const mockUserRole = 'usuario';

  const mockNotifications = [
    {
      id: 'notif-1',
      user_id: mockUserId,
      tipo: 'mensaje_sistema' as const,
      titulo: 'Notificación 1',
      mensaje: 'Mensaje de prueba 1',
      leida: false,
      url: '/dashboard',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'notif-2',
      user_id: mockUserId,
      tipo: 'solicitud_aprobada' as const,
      titulo: 'Notificación 2',
      mensaje: 'Mensaje de prueba 2',
      leida: true,
      url: '/dashboard/despachos',
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debería renderizar el icono de campana', () => {
    (NotificationService.getUserNotifications as jest.Mock).mockResolvedValue([]);
    (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(0);

    render(<NotificationBell userId={mockUserId} userRole={mockUserRole} />);

    const bellButton = screen.getByLabelText('Notificaciones');
    expect(bellButton).toBeInTheDocument();
  });

  it('debería mostrar contador de notificaciones no leídas', async () => {
    (NotificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(1);

    render(<NotificationBell userId={mockUserId} userRole={mockUserRole} />);

    await waitFor(() => {
      const badge = screen.getByText('1');
      expect(badge).toBeInTheDocument();
    });
  });

  it('debería mostrar "99+" cuando hay más de 99 notificaciones no leídas', async () => {
    (NotificationService.getUserNotifications as jest.Mock).mockResolvedValue([]);
    (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(150);

    render(<NotificationBell userId={mockUserId} userRole={mockUserRole} />);

    await waitFor(() => {
      const badge = screen.getByText('99+');
      expect(badge).toBeInTheDocument();
    });
  });

  it('debería abrir dropdown al hacer click en la campana', async () => {
    (NotificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(1);

    render(<NotificationBell userId={mockUserId} userRole={mockUserRole} />);

    const bellButton = screen.getByLabelText('Notificaciones');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      expect(screen.getByText('Notificación 1')).toBeInTheDocument();
    });
  });

  it('debería cerrar dropdown al hacer click fuera', async () => {
    (NotificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(1);

    render(
      <div>
        <NotificationBell userId={mockUserId} userRole={mockUserRole} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    // Abrir dropdown
    const bellButton = screen.getByLabelText('Notificaciones');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Notificación 1')).toBeInTheDocument();
    });

    // Click fuera
    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    await waitFor(() => {
      expect(screen.queryByText('Notificación 1')).not.toBeInTheDocument();
    });
  });

  it('debería mostrar mensaje cuando no hay notificaciones', async () => {
    (NotificationService.getUserNotifications as jest.Mock).mockResolvedValue([]);
    (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(0);

    render(<NotificationBell userId={mockUserId} userRole={mockUserRole} />);

    const bellButton = screen.getByLabelText('Notificaciones');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('No tienes notificaciones')).toBeInTheDocument();
    });
  });

  it('debería llamar a markAsRead al hacer click en una notificación no leída', async () => {
    (NotificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(1);
    (NotificationService.markAsRead as jest.Mock).mockResolvedValue(true);

    render(<NotificationBell userId={mockUserId} userRole={mockUserRole} />);

    const bellButton = screen.getByLabelText('Notificaciones');
    fireEvent.click(bellButton);

    await waitFor(() => {
      const notif = screen.getByText('Notificación 1');
      fireEvent.click(notif);
    });

    expect(NotificationService.markAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('debería llamar a markAllAsRead al hacer click en "Marcar todas como leídas"', async () => {
    (NotificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(1);
    (NotificationService.markAllAsRead as jest.Mock).mockResolvedValue(true);

    render(<NotificationBell userId={mockUserId} userRole={mockUserRole} />);

    const bellButton = screen.getByLabelText('Notificaciones');
    fireEvent.click(bellButton);

    await waitFor(() => {
      const markAllButton = screen.getByText('Marcar todas como leídas');
      fireEvent.click(markAllButton);
    });

    expect(NotificationService.markAllAsRead).toHaveBeenCalledWith(mockUserId);
  });

  it('debería recargar notificaciones cada 30 segundos', async () => {
    (NotificationService.getUserNotifications as jest.Mock).mockResolvedValue([]);
    (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(0);

    render(<NotificationBell userId={mockUserId} userRole={mockUserRole} />);

    // Esperar carga inicial
    await waitFor(() => {
      expect(NotificationService.getUserNotifications).toHaveBeenCalledTimes(1);
    });

    // Avanzar 30 segundos
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(NotificationService.getUserNotifications).toHaveBeenCalledTimes(2);
    });
  });

  it('debería mostrar estado de carga', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (NotificationService.getUserNotifications as jest.Mock).mockReturnValue(promise);
    (NotificationService.getUnreadCount as jest.Mock).mockReturnValue(promise);

    render(<NotificationBell userId={mockUserId} userRole={mockUserRole} />);

    const bellButton = screen.getByLabelText('Notificaciones');
    fireEvent.click(bellButton);

    // Debería mostrar loading
    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    // Resolver promesa
    resolvePromise([]);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
  });
});
