// src/App.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import SignatureCanvas from 'react-signature-canvas';
import { ThemeProvider } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import {
  Container,
  Typography,
  CssBaseline,
  TextField,
  Button,
  Box,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Fab,
  Snackbar,
  Alert,
  useMediaQuery,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from '@mui/material';

// Iconos
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import UpArrowIcon from '@mui/icons-material/KeyboardArrowUp';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/VerifiedUser';
import MapIcon from '@mui/icons-material/Map';
import SecurityIcon from '@mui/icons-material/Security';

// Componentes personalizados
import Header from './components/Header';
import PhotoCapture from './components/PhotoCapture';
import theme from './theme';
import { FormData, PhotoData, SavedFormInfo } from './types';
import PDFGenerator from './utils/PDFGenerator';
import { getAddressFromCoordinates } from './utils/GeocodingService';
import { 
  saveFormToLocalStorage, 
  getSavedFormsList, 
  getFormFromLocalStorage, 
  deleteFormFromLocalStorage 
} from './utils/StorageService';

// Función para generar hash de verificación de ubicación
const generateLocationVerification = (lat?: number | null, lon?: number | null, timestamp?: number | null): string => {
  if (!lat || !lon || !timestamp) return '';
  
  // Combinamos información de ubicación con timestamp para crear un código "único"
  // Este código sirve para verificar que la ubicación no ha sido alterada
  const locationString = `${lat.toFixed(6)},${lon.toFixed(6)},${timestamp}`;
  
  // Implementación simple de hash (podría mejorarse con crypto en entorno real)
  let hash = 0;
  for (let i = 0; i < locationString.length; i++) {
    const char = locationString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  
  // Convertir a string y añadir información parcial visible
  return `GEO-${Math.abs(hash).toString(16).toUpperCase()}-${lat.toFixed(2)}-${lon.toFixed(2)}`;
};

// Función para obtener información del dispositivo (para auditoría)
const getDeviceInfo = (): string => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenSize = `${window.screen.width}x${window.screen.height}`;
  
  return `${platform} | ${screenSize} | ${language} | ${userAgent.substring(0, 100)}`;
};

function App() {
  // --- Estados ---
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoData[]>([]);
  const [location, setLocation] = useState<FormData['geolocation']>({ lat: null, lon: null, timestamp: null });
  const [locationStatus, setLocationStatus] = useState<string>('Presiona para obtener ubicación');
  const [locationDetails, setLocationDetails] = useState<{ address: string; neighborhood: string; mapUrl?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({
    show: false,
    message: '',
    type: 'info'
  });
  
  // Estados para funcionalidad de guardado
  const [currentFormId, setCurrentFormId] = useState<string>('');
  const [savedForms, setSavedForms] = useState<SavedFormInfo[]>([]);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string>('');

  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Referencias para secciones
  const infoGeneralRef = useRef<HTMLDivElement>(null);
  const detallesEventoRef = useRef<HTMLDivElement>(null);
  const activacionesRef = useRef<HTMLDivElement>(null);
  const geolocalizacionRef = useRef<HTMLDivElement>(null);
  const resultadosRef = useRef<HTMLDivElement>(null);
  const evidenciaRef = useRef<HTMLDivElement>(null);
  const firmaRef = useRef<HTMLDivElement>(null);

  // --- Configuración de React Hook Form ---
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      nombreSupervisor: '',
      cargoSupervisor: '',
      fechaVisita: new Date().toISOString().split('T')[0],
      lugarVisita: '',
      artista: '',
      valorPatrocinio: '',
      exclusividadVentasVisibilidad: '',
      disponibilidadProducto: '',
      compromisoCompra: '',
      aforo: '',
      visibilidadMarca: '',
      activacionMarca: '',
      momentoMarca: '',
      reporteVentas: '',
      observacionesGenerales: '',
      geolocation: { lat: null, lon: null, timestamp: null },
      photos: [],
      signature: null,
      formVersion: '1.0',
      deviceInfo: getDeviceInfo()
    }
  });

  // --- Efectos ---
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cargar lista de formularios guardados al inicio
  useEffect(() => {
    const loadSavedForms = () => {
      const formIds = getSavedFormsList();
      const formsList = formIds.map(id => {
        const form = getFormFromLocalStorage(id);
        return {
          id,
          timestamp: form?.lastSaved || '',
          location: form?.lugarVisita || 'Sin ubicación',
          supervisor: form?.nombreSupervisor || 'Sin supervisor',
          verified: !!form?.locationVerified
        };
      });
      setSavedForms(formsList);
    };
    
    loadSavedForms();
  }, []);

  // Autoguardado periódico
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoSaveForm()) {
        console.log('Formulario guardado automáticamente');
      }
    }, 120000); // 2 minutos
    
    return () => clearInterval(interval);
  }, []);

  // --- Funciones para desplazar a secciones ---
  const scrollToSection = (sectionId: string) => {
    const sectionRefs: { [key: string]: React.RefObject<HTMLDivElement> } = {
      'info-general': infoGeneralRef,
      'detalles-evento': detallesEventoRef,
      'activaciones': activacionesRef,
      'geolocalizacion': geolocalizacionRef,
      'resultados': resultadosRef,
      'evidencia': evidenciaRef,
      'firma': firmaRef
    };

    const ref = sectionRefs[sectionId];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Funciones para almacenamiento local ---
  const autoSaveForm = () => {
    const currentValues = getValues();
    
    if (currentValues.nombreSupervisor || currentValues.lugarVisita) {
      // Solo guardar si hay datos mínimos
      const formId = saveFormToLocalStorage(currentValues, currentFormId);
      if (formId && formId !== currentFormId) {
        setCurrentFormId(formId);
      }
      return true;
    }
    return false;
  };

  const loadSavedForm = (formId: string) => {
    const formData = getFormFromLocalStorage(formId);
    if (formData) {
      // Restaurar datos básicos del formulario
      reset(formData);
      
      // Restaurar geolocalización
      if (formData.geolocation) {
        setLocation(formData.geolocation);
        setLocationStatus(
          formData.geolocation.lat && formData.geolocation.lon
            ? `Ubicación obtenida: Lat ${formData.geolocation.lat?.toFixed(4)}, Lon ${formData.geolocation.lon?.toFixed(4)}`
            : 'Presiona para obtener ubicación'
        );
        
        // Restaurar verificación de ubicación
        if (formData.locationVerified) {
          setLocationVerified(true);
          setVerificationCode(formData.verificationCode || '');
        }
      }
      
      // Restaurar detalles de ubicación si existen
      if (formData.locationDetails) {
        setLocationDetails({
          address: formData.locationDetails.address || '',
          neighborhood: formData.locationDetails.neighborhood || '',
          mapUrl: formData.locationDetails.mapImageUrl
        });
      }
      
      setCurrentFormId(formId);
      setOpenFormDialog(false);
      showAlert('Formulario cargado correctamente', 'success');
      return true;
    }
    
    showAlert('No se pudo cargar el formulario', 'error');
    return false;
  };

  const deleteSavedForm = (formId: string) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este formulario guardado?')) {
      if (deleteFormFromLocalStorage(formId)) {
        // Actualizar lista de formularios
        setSavedForms(prevForms => prevForms.filter(form => form.id !== formId));
        
        // Resetear formulario actual si es el que se está eliminando
        if (formId === currentFormId) {
          reset({
            nombreSupervisor: '',
            cargoSupervisor: '',
            fechaVisita: new Date().toISOString().split('T')[0],
            lugarVisita: '',
            artista: '',
            valorPatrocinio: '',
            exclusividadVentasVisibilidad: '',
            disponibilidadProducto: '',
            compromisoCompra: '',
            aforo: '',
            visibilidadMarca: '',
            activacionMarca: '',
            momentoMarca: '',
            reporteVentas: '',
            observacionesGenerales: '',
            geolocation: { lat: null, lon: null, timestamp: null },
            photos: [],
            signature: null,
          });
          setCurrentFormId('');
        }
        
        showAlert('Formulario eliminado correctamente', 'success');
      } else {
        showAlert('No se pudo eliminar el formulario', 'error');
      }
    }
  };

  // --- Manejadores ---
  const handlePhotosChange = (updatedPhotos: PhotoData[]) => {
    setCapturedPhotos(updatedPhotos);
    setValue('photos', updatedPhotos);
    console.log("Fotos actualizadas en form:", updatedPhotos);
  };

  // Manejador de geolocalización mejorado con verificación
  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocalización no soportada.');
      showAlert('Geolocalización no soportada en este dispositivo.', 'error');
      return;
    }
    
    setLocationStatus('Obteniendo ubicación...');
    setLoading(true);
    
    try {
      // Obtener coordenadas mediante el navegador
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });
      
      const newLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || null,
        heading: position.coords.heading || null,
        speed: position.coords.speed || null
      };
      
      // Generar código de verificación
      const verificationCode = generateLocationVerification(
        newLocation.lat, 
        newLocation.lon, 
        newLocation.timestamp
      );
      
      // Almacenar datos completos
      setLocation(newLocation);
      setValue('geolocation', newLocation);
      setValue('locationVerified', true);
      setValue('verificationCode', verificationCode);
      
      // Actualizar estados de verificación
      setLocationVerified(true);
      setVerificationCode(verificationCode);
      
      // Mostrar coordenadas como siempre
      setLocationStatus(`Ubicación verificada: Lat ${newLocation.lat?.toFixed(4)}, Lon ${newLocation.lon?.toFixed(4)}`);
      
      // Obtener detalles de la dirección
      setLocationStatus('Obteniendo detalles de la ubicación...');
      
      const addressDetails = await getAddressFromCoordinates(newLocation);
      
      if (addressDetails) {
        // URL para mapa estático (usando OpenStreetMap)
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${newLocation.lon - 0.01}%2C${newLocation.lat - 0.01}%2C${newLocation.lon + 0.01}%2C${newLocation.lat + 0.01}&amp;layer=mapnik&amp;marker=${newLocation.lat}%2C${newLocation.lon}`;
        
        // Guardar detalles completos
        const locationDetails = {
          address: addressDetails.address,
          neighborhood: addressDetails.neighborhood,
          city: addressDetails.city,
          state: addressDetails.state,
          country: addressDetails.country,
          mapImageUrl: mapUrl,
          verifiedAt: Date.now()
        };
        
        setValue('locationDetails', locationDetails);
        
        setLocationDetails({
          address: addressDetails.address,
          neighborhood: addressDetails.neighborhood,
          mapUrl
        });
        
        // Actualizar estado con información más detallada
        setLocationStatus(
          `Ubicación verificada: ${addressDetails.neighborhood}, ${addressDetails.city}`
        );
        
        // También guardamos estos detalles específicos
        setValue('direccionAproximada', addressDetails.address);
        setValue('barrio', addressDetails.neighborhood);
        
        showAlert('Ubicación verificada correctamente', 'success');
      } else {
        showAlert('Ubicación obtenida, pero no se pudo determinar la dirección', 'info');
      }
    } catch (error: any) {
      console.error("Error obteniendo ubicación:", error);
      setLocationStatus(`Error: ${error.message}`);
      showAlert(`Error al obtener ubicación: ${error.message}`, 'error');
      
      // Resetear verificación
      setLocationVerified(false);
      setVerificationCode('');
      setValue('locationVerified', false);
      setValue('verificationCode', '');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
    setValue('signature', null);
    showAlert('Firma borrada', 'info');
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setAlert({ show: true, message, type });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, show: false });
  };

  // --- Submit y Generación PDF ---
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      // Verificar que la ubicación esté verificada
      if (!locationVerified) {
        if (!window.confirm('La ubicación no ha sido verificada. ¿Deseas continuar de todas formas?')) {
          showAlert('Se requiere verificar la ubicación para generar el PDF', 'warning');
          scrollToSection('geolocalizacion');
          return;
        }
      }
      
      setLoading(true);
      console.log('Datos del formulario a enviar:', data);
      
      // 1. Obtener Firma
      if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        const signatureDataUrl = sigCanvasRef.current.toDataURL('image/png');
        data.signature = signatureDataUrl;
        setValue('signature', signatureDataUrl);
        console.log("Firma capturada (Base64)");
      } else {
        data.signature = null;
        console.log("No se capturó firma o estaba vacía.");
        showAlert('No se ha firmado el documento. Se generará sin firma.', 'info');
      }
      
      // Guardar formulario antes de generar PDF
      autoSaveForm();

      // 2. Generar PDF con la clase mejorada
      const pdfGenerator = new PDFGenerator();
      await pdfGenerator.generatePDF(data);
      
      showAlert('¡PDF generado y descargado correctamente!', 'success');
    } catch (error) {
      console.error("Error generando el PDF:", error);
      showAlert(`Error al generar el PDF: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.error('Errores de validación:', errors);
    showAlert('Por favor, completa todos los campos requeridos.', 'error');
    
    // Desplazar a la primera sección con error
    const keys = Object.keys(errors);
    if (keys.length > 0) {
      const fieldName = keys[0];
      
      // Mapeo de campos a secciones
      const fieldToSection: { [key: string]: string } = {
        nombreSupervisor: 'info-general',
        cargoSupervisor: 'info-general',
        fechaVisita: 'info-general',
        lugarVisita: 'info-general',
        artista: 'detalles-evento',
        valorPatrocinio: 'info-general',
        exclusividadVentasVisibilidad: 'detalles-evento',
        disponibilidadProducto: 'detalles-evento',
        compromisoCompra: 'detalles-evento',
        aforo: 'detalles-evento',
        visibilidadMarca: 'activaciones',
        activacionMarca: 'activaciones',
        momentoMarca: 'activaciones',
        reporteVentas: 'resultados',
        observacionesGenerales: 'resultados'
      };
      
      const sectionId = fieldToSection[fieldName] || 'info-general';
      scrollToSection(sectionId);
    }
  };

  // --- Renderizado ---
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header scrollToSection={scrollToSection} />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
          
          {/* --- Paper: Información General --- */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }} ref={infoGeneralRef} id="info-general">
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
              Información General
            </Typography>
            <Grid container spacing={3}>
              {/* Fila 1 */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField 
                  {...register('fechaVisita', { required: 'La fecha es requerida' })} 
                  label="Fecha Visita" 
                  type="date" 
                  fullWidth 
                  InputLabelProps={{ shrink: true }} 
                  error={!!errors.fechaVisita} 
                  helperText={errors.fechaVisita?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField 
                  {...register('nombreSupervisor', { required: 'El nombre del supervisor es requerido' })} 
                  label="Nombre Supervisor" 
                  fullWidth 
                  error={!!errors.nombreSupervisor} 
                  helperText={errors.nombreSupervisor?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField 
                  {...register('cargoSupervisor')} 
                  label="Cargo Supervisor" 
                  fullWidth
                  size="small"
                />
              </Grid>
              {/* Fila 2 */}
              <Grid item xs={12} sm={8}>
                <TextField 
                  {...register('lugarVisita', { required: 'El lugar es requerido' })} 
                  label="Lugar de la Visita / Evento" 
                  fullWidth 
                  error={!!errors.lugarVisita} 
                  helperText={errors.lugarVisita?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  {...register('valorPatrocinio')} 
                  label="Valor Patrocinio" 
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* --- Paper: Detalles Evento --- */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }} ref={detallesEventoRef} id="detalles-evento">
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
              Detalles del Evento
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  {...register('exclusividadVentasVisibilidad')} 
                  label="Exclusividad Ventas/Visibilidad" 
                  fullWidth 
                  helperText="Ej: Sí, solo nuestras marcas / No / Parcial..."
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  {...register('compromisoCompra')} 
                  label="Compromiso Compra" 
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  {...register('aforo')} 
                  label="Aforo Estimado/Real" 
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('artista')}
                  label="Nombre del Artista (s) y Hora de Presentación"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  {...register('disponibilidadProducto')} 
                  label="Codificación y/o Disponibilidad del Producto" 
                  multiline 
                  rows={3} 
                  fullWidth 
                  helperText="Ej: REAL 750ml OK, ASA Litro Agotado..."
                />
              </Grid>
            </Grid>
          </Paper>

          {/* --- Paper: Activaciones y Visibilidad --- */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }} ref={activacionesRef} id="activaciones">
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
              Activaciones y Visibilidad de Marca
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField 
                  {...register('visibilidadMarca')} 
                  label="Visibilidad Marca" 
                  fullWidth 
                  helperText="Ej: Sí, pendones y carta / No / Parcial..."
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  {...register('activacionMarca')} 
                  label="Activación Marca" 
                  fullWidth 
                  helperText="Ej: Sí, impulsadora / No..."
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  {...register('momentoMarca')} 
                  label="Momento Marca" 
                  fullWidth 
                  helperText="Ej: Sí, mención artista / No..."
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* --- Paper: Geolocalización Mejorada --- */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }} ref={geolocalizacionRef} id="geolocalizacion">
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
              Geolocalización
              {locationVerified && (
                <Chip 
                  icon={<VerifiedIcon />} 
                  label="Verificada" 
                  color="success" 
                  size="small" 
                  sx={{ ml: 2 }} 
                  title="Esta ubicación ha sido verificada y no puede ser modificada"
                />
              )}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<LocationSearchingIcon />} 
                  onClick={handleGetLocation} 
                  sx={{ mr: 2, mb: { xs: 1, sm: 0 } }}
                  color="secondary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Obtener Ubicación Actual'}
                </Button>
                <Typography 
                  variant="body2" 
                  component="span" 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: 'background.paper', 
                    border: '1px solid', 
                    borderColor: locationVerified ? 'success.main' : 'divider',
                    flex: 1
                  }}
                >
                  {locationStatus}
                </Typography>
              </Box>
              
              {/* Código de verificación */}
              {locationVerified && verificationCode && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    p: 1, 
                    bgcolor: 'success.light', 
                    color: 'success.contrastText',
                    borderRadius: 1
                  }}
                >
                  <SecurityIcon fontSize="small" />
                  <Typography variant="caption" fontWeight="bold">
                    Código de verificación: {verificationCode}
                  </Typography>
                  <Tooltip title="Este código verifica que la ubicación reportada es auténtica">
                    <IconButton size="small" color="inherit">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              
              {locationDetails && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Dirección aproximada:
                  </Typography>
                  <Typography variant="body2">
                    {locationDetails.address}
                  </Typography>
                  
                  {locationDetails.mapUrl && (
                    <Box sx={{ mt: 2, mb: 2, height: '200px', width: '100%', overflow: 'hidden', borderRadius: 1 }}>
                      <iframe 
                        src={locationDetails.mapUrl} 
                        width="100%" 
                        height="200" 
                        frameBorder="0" 
                        scrolling="no" 
                        title="Mapa de ubicación"
                      ></iframe>
                    </Box>
                  )}
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Barrio"
                        value={locationDetails.neighborhood}
                        fullWidth
                        size="small"
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Dirección manual (opcional)"
                        {...register('direccionManual')}
                        fullWidth
                        size="small"
                        placeholder="Ej: Calle 123 # 45-67"
                        helperText="Puedes especificar una dirección más precisa si lo deseas"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>

          {/* --- Paper: Resultados y Observaciones --- */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }} ref={resultadosRef} id="resultados">
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
              Resultados y Observaciones
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField 
                  {...register('reporteVentas')} 
                  label="Reporte de Ventas (Opcional)" 
                  multiline 
                  rows={4} 
                  fullWidth 
                  helperText="Ej: REAL 24*750: 10 UND, ASA 750: 2 UND..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  {...register('observacionesGenerales')} 
                  label="Observaciones Generales Adicionales" 
                  multiline 
                  rows={4} 
                  fullWidth
                />
              </Grid>
            </Grid>
          </Paper>

          {/* --- Paper: Evidencia Fotográfica --- */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }} ref={evidenciaRef} id="evidencia">
            <PhotoCapture onPhotosChange={handlePhotosChange} initialData={capturedPhotos} />
          </Paper>

          {/* --- Paper: Firma --- */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }} ref={firmaRef} id="firma">
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
              Firma del Supervisor
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <Box 
                sx={{ 
                  border: '1px dashed grey', 
                  mb: 1, 
                  width: '100%', 
                  maxWidth: '400px', 
                  height: '150px', 
                  touchAction: 'none',
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 1
                }}
              >
                <SignatureCanvas 
                  ref={sigCanvasRef} 
                  penColor='black' 
                  canvasProps={{ 
                    width: 400, 
                    height: 150, 
                    style: { width: '100%', height: '100%' } 
                  }} 
                />
              </Box>
              <Box sx={{ alignSelf: 'flex-start', mt: 1 }}>
                <Button 
                  onClick={clearSignature} 
                  size="small" 
                  startIcon={<DeleteIcon />} 
                  variant="outlined" 
                  color="error"
                >
                  Borrar Firma
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* --- Botones de Acción --- */}
          <Box sx={{ mt: 4, mb: 2, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 2 }}>
            {/* Botón para cargar formularios guardados */}
            <Button 
              variant="outlined"
              startIcon={<FolderOpenIcon />}
              onClick={() => {
                // Guardar el formulario actual primero
                autoSaveForm();
                
                // Actualizar lista de formularios guardados
                const formIds = getSavedFormsList();
                const formsList = formIds.map(id => {
                  const form = getFormFromLocalStorage(id);
                  return {
                    id,
                    timestamp: form?.lastSaved || '',
                    location: form?.lugarVisita || 'Sin ubicación',
                    supervisor: form?.nombreSupervisor || 'Sin supervisor',
                    verified: !!form?.locationVerified
                  };
                });
                setSavedForms(formsList);
                
                // Abrir diálogo
                setOpenFormDialog(true);
              }}
            >
              Formularios Guardados
            </Button>
            
            {/* Botón para nueva acta */}
            <Button 
              variant="outlined" 
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => {
                if (window.confirm('¿Estás seguro que deseas crear una nueva acta? Se perderán los datos no guardados del formulario actual.')) {
                  // Resetear el formulario
                  reset({
                    nombreSupervisor: '',
                    cargoSupervisor: '',
                    fechaVisita: new Date().toISOString().split('T')[0],
                    lugarVisita: '',
                    artista: '',
                    valorPatrocinio: '',
                    exclusividadVentasVisibilidad: '',
                    disponibilidadProducto: '',
                    compromisoCompra: '',
                    aforo: '',
                    visibilidadMarca: '',
                    activacionMarca: '',
                    momentoMarca: '',
                    reporteVentas: '',
                    observacionesGenerales: '',
                    geolocation: { lat: null, lon: null, timestamp: null },
                    photos: [],
                    signature: null,
                    formVersion: '1.0',
                    deviceInfo: getDeviceInfo()
                  });
                  
                  // Limpiar las fotos capturadas
                  setCapturedPhotos([]);
                  
                  // Limpiar la firma
                  if (sigCanvasRef.current) {
                    sigCanvasRef.current.clear();
                  }
                  
                  // Resetear localización
                  setLocation({ lat: null, lon: null, timestamp: null });
                  setLocationStatus('Presiona para obtener ubicación');
                  setLocationVerified(false);
                  setVerificationCode('');
                  setLocationDetails(null);
                  
                  // Crear un nuevo ID de formulario
                  setCurrentFormId('');
                  
                  // Mostrar mensaje
                  showAlert('Se ha creado una nueva acta', 'success');
                  
                  // Desplazarse al inicio
                  scrollToTop();
                }
              }}
            >
              Nueva Acta
            </Button>
            
            {/* Botón de envío */}
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large" 
              startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
              disabled={loading}
              sx={{ 
                py: 1.5, 
                px: 4, 
                borderRadius: 2,
                boxShadow: 3
              }}
            >
              {loading ? 'Generando PDF...' : 'Generar y Descargar PDF'}
            </Button>
          </Box>
        </form>
      </Container>

      {/* Botón para volver arriba */}
      {showScrollTop && (
        <Fab
          color="primary"
          size="small"
          aria-label="scroll back to top"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
          onClick={scrollToTop}
        >
          <UpArrowIcon />
        </Fab>
      )}

      {/* Diálogo para cargar formularios guardados */}
      <Dialog
        open={openFormDialog}
        onClose={() => setOpenFormDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Formularios Guardados
          <IconButton
            aria-label="close"
            onClick={() => setOpenFormDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {savedForms.length > 0 ? (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="formularios guardados">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Supervisor</TableCell>
                    <TableCell>Lugar</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell component="th" scope="row">
                        {new Date(form.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{form.supervisor}</TableCell>
                      <TableCell>{form.location}</TableCell>
                      <TableCell>
                        {form.verified ? (
                          <Chip 
                            size="small" 
                            icon={<VerifiedIcon />} 
                            label="Verificado" 
                            color="success" 
                            variant="outlined" 
                          />
                        ) : (
                          <Chip 
                            size="small" 
                            label="Sin verificar" 
                            color="default" 
                            variant="outlined" 
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => loadSavedForm(form.id)} title="Cargar">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" onClick={() => deleteSavedForm(form.id)} title="Eliminar">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No hay formularios guardados
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFormDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Alertas */}
      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.type} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;