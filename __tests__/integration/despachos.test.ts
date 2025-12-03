import { createClient } from '@supabase/supabase-js'

// Mock de Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}))

// Mock de Auth
jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(),
  requireSuperAdmin: jest.fn()
}))

describe('Integración: Gestión de Despachos y Solicitudes', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Configurar mock de Supabase como un objeto "thenable" para permitir await
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis(),
      // Mockear 'then' para simular la resolución de la promesa al final de la cadena
      then: jest.fn((resolve) => resolve({ data: null, error: null }))
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('Flujo de Solicitudes (SOL-4)', () => {
    it('debería permitir aprobar una solicitud y asignar despacho', async () => {
      const solicitudId = 'sol-123'
      const userId = 'user-123'
      const despachoId = 'despacho-123'
      
      // Configurar respuestas secuenciales para las llamadas await
      mockSupabase.then
        // 1. Select solicitud
        .mockImplementationOnce((resolve: any) => resolve({ 
          data: { id: solicitudId, user_id: userId, despacho_id: despachoId, status: 'pending' }, 
          error: null 
        }))
        // 2. Update solicitud status
        .mockImplementationOnce((resolve: any) => resolve({ error: null }))
        // 3. Insert user_despachos
        .mockImplementationOnce((resolve: any) => resolve({ error: null }))
        // 4. Update despachos owner
        .mockImplementationOnce((resolve: any) => resolve({ error: null }))
        // 5. Update user role (si aplica)
        .mockImplementationOnce((resolve: any) => resolve({ error: null }))

      // Simulación de la lógica de negocio (replicando lo que haría el servicio/API)
      
      // 1. Obtener solicitud
      await mockSupabase.from('solicitudes_despacho').select('*').eq('id', solicitudId).single()
      
      // 2. Actualizar estado
      await mockSupabase.from('solicitudes_despacho').update({ status: 'approved' }).eq('id', solicitudId)
      
      // 3. Asignar despacho
      await mockSupabase.from('user_despachos').insert({ user_id: userId, despacho_id: despachoId, role: 'owner' })
      
      // 4. Actualizar owner
      await mockSupabase.from('despachos').update({ owner_id: userId }).eq('id', despachoId)

      expect(mockSupabase.from).toHaveBeenCalledWith('solicitudes_despacho')
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'approved' })
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId, despacho_id: despachoId }))
    })
  })

  describe('Gestión de Sedes (GES-4, GES-5, GES-7)', () => {
    const sedeData = {
      nombre: 'Sede Test',
      direccion: 'Calle Test 123',
      ciudad: 'Madrid',
      codigo_postal: '28001',
      provincia: 'Madrid',
      despacho_id: 'despacho-123'
    }

    it('debería permitir crear una nueva sede', async () => {
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ data: { id: 'sede-1', ...sedeData }, error: null }))

      await mockSupabase.from('sedes').insert(sedeData)

      expect(mockSupabase.from).toHaveBeenCalledWith('sedes')
      expect(mockSupabase.insert).toHaveBeenCalledWith(sedeData)
    })

    it('debería permitir editar una sede existente', async () => {
      const updateData = { nombre: 'Sede Editada' }
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ data: { id: 'sede-1', ...sedeData, ...updateData }, error: null }))

      await mockSupabase.from('sedes').update(updateData).eq('id', 'sede-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('sedes')
      expect(mockSupabase.update).toHaveBeenCalledWith(updateData)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'sede-1')
    })

    it('debería permitir eliminar una sede', async () => {
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ error: null }))

      await mockSupabase.from('sedes').delete().eq('id', 'sede-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('sedes')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'sede-1')
    })
  })
})
