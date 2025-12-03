import { createClient } from '@supabase/supabase-js';

// Mock de Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

// Mock del módulo supabase
jest.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    auth: {
      getUser: jest.fn()
    }
  };
  
  return {
    supabase: mockSupabase
  };
});

import { UserService } from '@/lib/userService';
import { supabase } from '@/lib/supabase';
import { UserRole, UserStatus } from '@/lib/types';


describe('UserService - Tests Unitarios', () => {
  let userService: UserService;
  let mockSupabase: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Obtener el mock de supabase
    mockSupabase = supabase as any;
    
    // Crear instancia del servicio
    userService = new UserService();
  });

  describe('getUserById', () => {
    it('debería obtener un usuario por ID exitosamente', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        nombre: 'Test',
        apellidos: 'User',
        rol: 'usuario' as UserRole,
        estado: 'activo' as UserStatus,
        activo: true,
        email_verificado: true,
        plan: 'basico',
        fecha_registro: new Date().toISOString()
      };

      (mockSupabase.maybeSingle as jest.Mock).mockResolvedValueOnce({
        data: mockUser,
        error: null
      });

      const result = await userService.getUserById('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toBeTruthy();
      expect(result?.id).toBe('user-123');
    });

    it('debería retornar null si el usuario no existe', async () => {
      (mockSupabase.maybeSingle as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await userService.getUserById('user-nonexistent');

      expect(result).toBeNull();
    });

    it('debería retornar null si hay un error PGRST116', async () => {
      (mockSupabase.maybeSingle as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });

      const result = await userService.getUserById('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('debería obtener un usuario por email exitosamente', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        nombre: 'Test',
        apellidos: 'User',
        rol: 'usuario' as UserRole,
        estado: 'activo' as UserStatus
      };

      (mockSupabase.maybeSingle as jest.Mock).mockResolvedValueOnce({
        data: mockUser,
        error: null
      });

      const result = await userService.getUserByEmail('test@example.com');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'test@example.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('debería crear un usuario exitosamente', async () => {
      const userData = {
        email: 'newuser@example.com',
        nombre: 'New',
        apellidos: 'User',
        telefono: '123456789',
        rol: 'usuario' as UserRole,
        estado: 'activo' as UserStatus
      };

      const mockCreatedUser = {
        id: 'user-new',
        ...userData,
        activo: true,
        email_verificado: false,
        plan: 'basico',
        fecha_registro: new Date().toISOString()
      };

      (mockSupabase.maybeSingle as jest.Mock).mockResolvedValueOnce({
        data: mockCreatedUser,
        error: null
      });

      const result = await userService.createUser(userData);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          rol: userData.rol
        })
      );
      expect(result).toEqual(mockCreatedUser);
    });

    it('debería lanzar error si falla la creación', async () => {
      const userData = {
        email: 'newuser@example.com',
        nombre: 'New',
        apellidos: 'User',
        rol: 'usuario' as UserRole
      };

      const mockError = new Error('Email already exists');
      (mockSupabase.maybeSingle as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: mockError
      });

      await expect(userService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('debería actualizar un usuario exitosamente', async () => {
      const updates = {
        nombre: 'Updated',
        telefono: '987654321'
      };

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        nombre: 'Updated',
        apellidos: 'User',
        telefono: '987654321',
        rol: 'usuario' as UserRole,
        estado: 'activo' as UserStatus,
        activo: true,
        email_verificado: true,
        plan: 'basico',
        fecha_registro: new Date().toISOString()
      };

      (mockSupabase.single as jest.Mock).mockResolvedValueOnce({
        data: mockUpdatedUser,
        error: null
      });

      const result = await userService.updateUser('user-123', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(result.nombre).toBe('Updated');
    });
  });

  describe('approveUser', () => {
    it('debería aprobar un usuario y cambiar su estado', async () => {
      const mockApprovedUser = {
        id: 'user-123',
        email: 'test@example.com',
        nombre: 'Test',
        apellidos: 'User',
        rol: 'usuario' as UserRole,
        estado: 'activo' as UserStatus,
        fecha_aprobacion: new Date().toISOString(),
        aprobado_por: 'admin-123',
        activo: true,
        email_verificado: true,
        plan: 'basico',
        fecha_registro: new Date().toISOString()
      };

      (mockSupabase.single as jest.Mock).mockResolvedValueOnce({
        data: mockApprovedUser,
        error: null
      });

      const result = await userService.approveUser('user-123', 'admin-123');

      expect(mockSupabase.update).toHaveBeenCalled();
      expect(result.estado).toBe('activo');
    });
  });

  describe('getAllUsers', () => {
    it('debería obtener todos los usuarios', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          nombre: 'User',
          apellidos: 'One',
          rol: 'usuario' as UserRole,
          estado: 'activo' as UserStatus,
          activo: true,
          email_verificado: true,
          plan: 'basico',
          fecha_registro: new Date().toISOString()
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          nombre: 'User',
          apellidos: 'Two',
          rol: 'despacho_admin' as UserRole,
          estado: 'activo' as UserStatus,
          activo: true,
          email_verificado: true,
          plan: 'basico',
          fecha_registro: new Date().toISOString()
        }
      ];

      // Mock the order method to return the mock data
      (mockSupabase.order as jest.Mock).mockResolvedValueOnce({
        data: mockUsers,
        error: null
      });

      const result = await userService.getAllUsers();

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });
});
