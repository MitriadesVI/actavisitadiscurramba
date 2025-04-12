// src/types.ts
export interface PhotoData {
    id: string;
    file: File;
    dataUrl: string;
    description: string;
    timestamp: number;
  }
  
  export interface FormData {
    nombreSupervisor: string;
    cargoSupervisor: string;
    fechaVisita: string;
    lugarVisita: string;
    artista: string;
    valorPatrocinio: string;
    exclusividadVentasVisibilidad: string;
    disponibilidadProducto: string;
    compromisoCompra: string;
    aforo: string;
    visibilidadMarca: string;
    activacionMarca: string;
    momentoMarca: string;
    reporteVentas: string;
    observacionesGenerales: string;
    geolocation: {
      lat: number | null;
      lon: number | null;
      timestamp: number | null;
    };
    photos: PhotoData[];
    signature: string | null;
    formVersion?: string;
    deviceInfo?: string;
    direccionAproximada?: string;
    barrio?: string;
    direccionManual?: string;
    locationVerified?: boolean;
    verificationCode?: string;
    locationDetails?: {
      address: string;
      neighborhood: string;
      city?: string;
      state?: string;
      country?: string;
      mapImageUrl?: string;
      verifiedAt?: number;
    };
    lastSaved?: string;
  }
  
  export interface SavedFormInfo {
    id: string;
    timestamp: string;
    location: string;
    supervisor: string;
    verified: boolean;
  }