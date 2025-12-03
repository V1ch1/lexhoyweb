// Usando require para evitar problemas de transpilación con mocks
const { SyncOrchestrator } = require('@/lib/sync')
const { SupabaseSync } = require('@/lib/sync/supabase')
const { WordPressSync } = require('@/lib/sync/wordpress')

// Mock de las dependencias
jest.mock('@/lib/sync/supabase', () => ({
  SupabaseSync: {
    getDespachoCompleto: jest.fn(),
    actualizarIdsSync: jest.fn(),
    actualizarEstadoVerificacion: jest.fn()
  }
}))

jest.mock('@/lib/sync/wordpress', () => ({
  WordPressSync: {
    enviarDespacho: jest.fn()
  }
}))

describe('Integración: Sincronización Multi-Sistema (SYN-1)', () => {
  const mockDespacho = {
    id: 'despacho-123',
    nombre: 'Despacho Test',
    slug: 'despacho-test',
    estado_verificacion: 'verificado',
    sedes: [
      {
        nombre: 'Sede Principal',
        localidad: 'Madrid',
        es_principal: true
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debería sincronizar correctamente un despacho nuevo (Supabase -> WordPress)', async () => {
    // 1. Mock Supabase: Devuelve el despacho completo
    SupabaseSync.getDespachoCompleto.mockResolvedValue(mockDespacho)

    // 2. Mock WordPress: Simula envío exitoso y devuelve IDs nuevos
    WordPressSync.enviarDespacho.mockResolvedValue({
      success: true,
      wordpressId: 1001,
      objectId: '1001'
    })

    // 3. Mock Supabase Update: Simula actualización de IDs exitosa
    SupabaseSync.actualizarIdsSync.mockResolvedValue(true)

    // Ejecutar sincronización
    const result = await SyncOrchestrator.sincronizarCompleto('despacho-123')

    // Verificaciones
    expect(SupabaseSync.getDespachoCompleto).toHaveBeenCalledWith('despacho-123')
    expect(WordPressSync.enviarDespacho).toHaveBeenCalledWith(mockDespacho)
    expect(SupabaseSync.actualizarIdsSync).toHaveBeenCalledWith('despacho-123', 1001, 1001)
    
    expect(result.success).toBe(true)
    expect(result.wordpressId).toBe(1001)
  })
})
