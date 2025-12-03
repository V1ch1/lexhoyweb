// 1. Mock next/server ANTES de cualquier importación
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string
      headers: Headers
      body: any
      
      constructor(url: string, init?: any) {
        this.url = url
        this.headers = new Headers(init?.headers)
        this.body = init?.body
      }

      async json() {
        return JSON.parse(this.body || '{}')
      }
    },
    NextResponse: {
      json: (body: any, init?: any) => ({ 
        json: async () => body, 
        status: init?.status || 200,
        ...init 
      })
    }
  }
})

// 2. Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
})

// 3. Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  },
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }
}))

// 4. Mock AILeadService
jest.mock('@/lib/services/aiLeadService', () => ({
  AILeadService: {
    processLead: jest.fn(),
    meetsQualityStandards: jest.fn(),
    calculateBasePrice: jest.fn(),
  }
}))

// 5. Imports
import { POST } from '@/app/api/webhooks/lexhoy/route'
import { NextRequest } from 'next/server' // Esto usará el mock
import { AILeadService } from '@/lib/services/aiLeadService'
import { supabaseAdmin } from '@/lib/supabase'

describe('Integración: Webhook de Leads (LED-4)', () => {
  const mockWebhookSecret = 'test-secret'
  
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.WEBHOOK_SECRET = mockWebhookSecret
  })

  it('debería procesar correctamente un lead válido desde WordPress', async () => {
    // Configurar comportamiento de los mocks
    const mockAnalysis = {
      resumenIA: 'Resumen test',
      especialidad: 'Laboral',
      provincia: 'Madrid',
      ciudad: 'Madrid',
      urgencia: 'alta',
      precioEstimado: 200,
      palabrasClave: ['despido', 'indemnización'],
      puntuacionCalidad: 85,
      nivelDetalle: 'alto'
    }

    ;(AILeadService.processLead as jest.Mock).mockResolvedValue(mockAnalysis)
    ;(AILeadService.meetsQualityStandards as jest.Mock).mockReturnValue(true)
    ;(AILeadService.calculateBasePrice as jest.Mock).mockReturnValue(20)

    // Mock de inserción en Supabase
    const mockLeadCreated = { id: 'lead-123', ...mockAnalysis, estado: 'procesado' }
    
    const singleMock = jest.fn().mockResolvedValue({ data: mockLeadCreated, error: null })
    const selectMock = jest.fn().mockReturnValue({ single: singleMock })
    const insertMock = jest.fn().mockReturnValue({ select: selectMock })
    
    ;(supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
      if (table === 'leads') {
        return { insert: insertMock }
      }
      return { insert: jest.fn().mockResolvedValue({ error: null }) }
    })

    // Crear Request usando el Mock
    const payload = {
      nombre: 'Juan Pérez',
      correo: 'juan@example.com',
      telefono: '600123456',
      cuerpoMensaje: 'Tengo un problema laboral...',
      urlPagina: 'https://lexhoy.com/abogados-laboralistas',
      tituloPost: 'Abogados Laboralistas en Madrid'
    }

    const req = new NextRequest('http://localhost:3000/api/webhooks/lexhoy', {
      method: 'POST',
      headers: {
        'x-webhook-secret': mockWebhookSecret,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    // Ejecutar Webhook
    const response = await POST(req)
    const json = await response.json()

    // Verificaciones
    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(AILeadService.processLead).toHaveBeenCalled()
  })

  it('debería diferenciar un lead desde la página de contacto', async () => {
    // Configurar Mocks
    const mockAnalysis = {
      resumenIA: 'Consulta general de contacto',
      especialidad: 'General',
      urgencia: 'media',
      precioEstimado: 100,
      palabrasClave: ['contacto'],
      puntuacionCalidad: 70,
      nivelDetalle: 'medio'
    }

    ;(AILeadService.processLead as jest.Mock).mockResolvedValue(mockAnalysis)
    ;(AILeadService.meetsQualityStandards as jest.Mock).mockReturnValue(true)
    ;(AILeadService.calculateBasePrice as jest.Mock).mockReturnValue(10)

    // Mock de inserción
    const mockLeadCreated = { 
      id: 'lead-contact-1', 
      ...mockAnalysis, 
      estado: 'procesado',
      titulo_post: 'Página de Contacto',
      url_pagina: 'https://lexhoy.com/contacto'
    }
    
    const singleMock = jest.fn().mockResolvedValue({ data: mockLeadCreated, error: null })
    const selectMock = jest.fn().mockReturnValue({ single: singleMock })
    const insertMock = jest.fn().mockReturnValue({ select: selectMock })
    
    ;(supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
      if (table === 'leads') {
        return { insert: insertMock }
      }
      return { insert: jest.fn().mockResolvedValue({ error: null }) }
    })

    // Payload de Contacto
    const payload = {
      nombre: 'Ana García',
      correo: 'ana@example.com',
      cuerpoMensaje: 'Quisiera información sobre sus tarifas...',
      urlPagina: 'https://lexhoy.com/contacto',
      tituloPost: 'Página de Contacto', // WordPress enviaría esto
      fuente: 'lexhoy.com'
    }

    const req = new NextRequest('http://localhost:3000/api/webhooks/lexhoy', {
      method: 'POST',
      headers: {
        'x-webhook-secret': mockWebhookSecret,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    await POST(req)

    // Verificar que se pasó la información correcta a la IA
    expect(AILeadService.processLead).toHaveBeenCalledWith(expect.objectContaining({
      tituloPost: 'Página de Contacto',
      urlPagina: 'https://lexhoy.com/contacto'
    }))

    // Verificar que se intentó guardar con los datos correctos
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      titulo_post: 'Página de Contacto',
      url_pagina: 'https://lexhoy.com/contacto'
    }))
  })
})
