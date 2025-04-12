// src/types.ts
export interface PhotoData {
    id: number;
    file: File;
    preview: string;
    description: string;
    timestamp: string;
  }
  
  export interface GeoLocationData {
    lat: number | null;
    lon: number | null;
    timestamp: number | null;
    accuracy?: number | null;
    altitude?: number | null;
    heading?: number | null;
    speed?: number | null;
    verificationHash?: string; // Hash para verificar integridad
  }
  
  export interface LocationDetails {
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    mapImageUrl?: string; // URL para imagen de mapa estático
    verifiedAt?: number; // Timestamp cuando se verificó la ubicación
  }
  
  export interface FormData {
    // Información General
    nombreSupervisor: string;
    cargoSupervisor: string;
    fechaVisita: string;
    lugarVisita: string;
    artista: string;
    valorPatrocinio: string;
    
    // Detalles del Evento
    exclusividadVentasVisibilidad: string;
    disponibilidadProducto: string;
    compromisoCompra: string;
    aforo: string;
    
    // Activaciones y Visibilidad
    visibilidadMarca: string;
    activacionMarca: string;
    momentoMarca: string;
    
    // Resultados y Observaciones
    reporteVentas: string;
    observacionesGenerales: string;
    
    // Datos Automáticos/Capturados
    geolocation: GeoLocationData;
    photos: PhotoData[];
    signature: string | null;
    
    // Campos adicionales de geolocalización
    direccionAproximada?: string;
    barrio?: string;
    direccionManual?: string;
    locationDetails?: LocationDetails;
    
    // Campos para verificación de autenticidad
    locationVerified?: boolean;
    verificationCode?: string; // Código que combina timestamp y coordenadas
    
    // Metadatos del formulario
    id?: string;
    lastSaved?: string;
    formVersion?: string;
    deviceInfo?: string; // Información del dispositivo para auditoría
  }
  
  // Interfaz para historial de formularios guardados
  export interface SavedFormInfo {
    id: string;
    timestamp: string;
    location: string;
    supervisor: string;
    verified: boolean;
  }