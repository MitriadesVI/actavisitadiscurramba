// src/utils/GeocodingService.ts

interface GeoLocation {
    lat: number | null;
    lon: number | null;
    timestamp: number | null;
  }
  
  interface LocationDetails {
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    raw: any;
  }
  
  // Usando la API gratuita de OpenStreetMap/Nominatim para geocodificación inversa
  export const getAddressFromCoordinates = async (location: GeoLocation): Promise<LocationDetails | null> => {
    if (!location.lat || !location.lon) {
      return null;
    }
  
    try {
      // API de Nominatim de OpenStreetMap (gratuita)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lon}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          // Es importante agregar un User-Agent para respetar los términos de uso
          'User-Agent': 'SupervisionEventosApp/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener dirección: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extraer los datos relevantes
      return {
        address: data.display_name || 'Dirección no disponible',
        neighborhood: data.address?.suburb || data.address?.neighbourhood || 'Barrio no disponible',
        city: data.address?.city || data.address?.town || data.address?.village || 'Ciudad no disponible',
        state: data.address?.state || 'Estado no disponible',
        country: data.address?.country || 'País no disponible',
        raw: data
      };
    } catch (error) {
      console.error('Error al obtener la dirección:', error);
      return null;
    }
  };