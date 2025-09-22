// Configuración general del proyecto Lexhoy Portal

export const APP_CONFIG = {
  name: "Lexhoy Portal",
  description: "Portal exclusivo para despachos de abogados",
  url: "https://despachos.lexhoy.com",
  version: "1.0.0",
  
  contact: {
    email: "contacto@lexhoy.com",
    phone: "+34 649 528 552",
    support: "contacto@lexhoy.com",
    despachos: "despachos@lexhoy.com",
    responsable: "manuel.blanco@lexhoy.com",
  },
  
  social: {
    facebook: "https://www.facebook.com/lexhoynoticias/",
    instagram: "https://www.instagram.com/lexhoynoticias/",
    linkedin: "https://www.linkedin.com/company/lex-hoy/about/",
    tiktok: "https://www.tiktok.com/@lexhoy",
    youtube: "https://www.youtube.com/@LexHoy",
  },
  
  // Configuración de especialidades jurídicas
  especialidades: [
    "Derecho Civil",
    "Derecho Penal", 
    "Derecho Laboral",
    "Derecho Mercantil",
    "Derecho Administrativo",
    "Derecho Fiscal y Tributario",
    "Derecho de Familia",
    "Derecho Inmobiliario",
    "Derecho Sanitario",
    "Derecho de Extranjería",
    "Derecho de Seguros",
    "Derecho Bancario",
    "Derecho de la Propiedad Intelectual",
    "Derecho Urbanístico",
    "Derecho del Consumidor",
    "Derecho Concursal",
    "Derecho Societario",
    "Derecho de Nuevas Tecnologías",
    "Derecho Ambiental",
    "Derecho de Protección de Datos"
  ],
  
  // Configuración de provincias
  provincias: [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
    "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
    "Castellón", "Ciudad Real", "Córdoba", "A Coruña", "Cuenca", "Gerona",
    "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares",
    "Jaén", "León", "Lérida", "Lugo", "Madrid", "Málaga", "Murcia",
    "Navarra", "Orense", "Palencia", "Las Palmas", "Pontevedra", "La Rioja",
    "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria",
    "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya",
    "Zamora", "Zaragoza", "Ceuta", "Melilla"
  ],
  
  // Configuración de planes
  planes: {
    basico: {
      name: "Básico",
      price: 0,
      leads: 5,
      features: [
        "Perfil en el directorio",
        "Acceso a noticias jurídicas", 
        "Hasta 5 leads/mes"
      ]
    },
    profesional: {
      name: "Profesional",
      price: 49,
      leads: 25,
      features: [
        "Todo lo del plan Básico",
        "Hasta 25 leads/mes",
        "Dashboard avanzado",
        "Soporte prioritario"
      ]
    },
    enterprise: {
      name: "Enterprise", 
      price: 149,
      leads: -1, // ilimitado
      features: [
        "Todo lo del plan Profesional",
        "Leads ilimitados",
        "Marketing digital incluido",
        "Account manager dedicado"
      ]
    }
  }
};

// Configuración para integraciones externas
export const INTEGRATIONS = {
  algolia: {
    appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
    searchKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "",
    adminKey: process.env.ALGOLIA_ADMIN_KEY || "",
    indexName: "despachos_abogados"
  },
  
  wordpress: {
    apiUrl: process.env.WORDPRESS_API_URL || "",
    username: process.env.WORDPRESS_USERNAME || "",
    password: process.env.WORDPRESS_PASSWORD || ""
  }
};

// Rutas de la aplicación
export const ROUTES = {
  public: {
    home: "/",
    about: "/sobre-nosotros", 
    services: "/servicios",
    contact: "/contacto",
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password"
  },
  dashboard: {
    home: "/dashboard",
    profile: "/dashboard/perfil", 
    leads: "/dashboard/leads",
    settings: "/dashboard/configuracion"
  }
};

// Configuración de validaciones
export const VALIDATION = {
  despacho: {
    nombreMin: 2,
    nombreMax: 100,
    descripcionMax: 500,
    telefonoRegex: /^(\+34|0034|34)?[6-9][0-9]{8}$/,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    websiteRegex: /^https?:\/\/.+\..+/
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true, 
    requireNumbers: true,
    requireSpecialChars: false
  }
};

export default APP_CONFIG;