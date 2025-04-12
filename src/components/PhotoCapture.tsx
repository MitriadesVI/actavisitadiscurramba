// src/components/PhotoCapture/PhotoCapture.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  CircularProgress
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { PhotoData } from '../../types';

interface PhotoCaptureProps {
  onPhotosChange: (photos: PhotoData[]) => void;
  initialData?: PhotoData[];
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotosChange, initialData = [] }) => {
  const [photos, setPhotos] = useState<PhotoData[]>(initialData);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoData | null>(null);
  const [openCamera, setOpenCamera] = useState(false);
  const [newPhotoDescription, setNewPhotoDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Limpieza del stream de la cámara cuando se desmonta el componente
      if (photoStream.current) {
        photoStream.current.getTracks().forEach((track) => track.stop());
        photoStream.current = null;
      }
    };
  }, []);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      addNewPhoto(file);
    }
  };

  const addNewPhoto = (file: File) => {
    const newPhoto: PhotoData = {
      id: Date.now(),
      file,
      preview: URL.createObjectURL(file),
      description: newPhotoDescription || 'Sin descripción',
      timestamp: new Date().toISOString()
    };

    const updatedPhotos = [...photos, newPhoto];
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
    setNewPhotoDescription('');
    setOpenCamera(false);
  };

  const handleDeletePhoto = (id: number) => {
    const updatedPhotos = photos.filter(photo => photo.id !== id);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const handleEditClick = (photo: PhotoData) => {
    setEditingPhotoId(photo.id);
    setEditDescription(photo.description);
  };

  const handleSaveEdit = () => {
    if (editingPhotoId === null) return;

    const updatedPhotos = photos.map(photo =>
      photo.id === editingPhotoId
        ? { ...photo, description: editDescription || 'Sin descripción' }
        : photo
    );

    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
    setEditingPhotoId(null);
    setEditDescription('');
  };

  const handleCancelEdit = () => {
    setEditingPhotoId(null);
    setEditDescription('');
  };

  const handleOpenCamera = async () => {
    try {
      setLoading(true);
      setOpenCamera(true);

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          photoStream.current = stream;
        }
      } else {
        console.error("No se puede acceder a la cámara");
      }
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      alert('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir canvas a blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
            addNewPhoto(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleCloseCamera = () => {
    if (photoStream.current) {
      photoStream.current.getTracks().forEach((track) => track.stop());
      photoStream.current = null;
    }
    setOpenCamera(false);
  };

  const handlePreviewPhoto = (photo: PhotoData) => {
    setPreviewPhoto(photo);
  };

  const handleClosePreview = () => {
    setPreviewPhoto(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Evidencia Fotográfica
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <TextField
          label="Descripción para la próxima foto"
          value={newPhotoDescription}
          onChange={(e) => setNewPhotoDescription(e.target.value)}
          placeholder="Describe lo que vas a capturar"
          fullWidth
          margin="normal"
          size="small"
        />
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PhotoCameraIcon />}
            onClick={handleOpenCamera}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Tomar Foto'}
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Subir Foto
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            hidden
            onChange={handleFileInput}
          />
        </Box>
      </Box>
      
      {photos.length > 0 ? (
        <Grid container spacing={2}>
          {photos.map((photo) => (
            <Grid item xs={12} sm={6} md={4} key={photo.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={photo.preview}
                  alt={photo.description}
                  sx={{ cursor: 'pointer', objectFit: 'cover' }}
                  onClick={() => handlePreviewPhoto(photo)}
                />
                <CardContent sx={{ flexGrow: 1, pt: 1, pb: 1 }}>
                  {editingPhotoId === photo.id ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <Typography variant="body2" component="div" noWrap sx={{ mb: 0.5 }}>
                      {photo.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(photo.timestamp).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 1, pt: 0 }}>
                  {editingPhotoId === photo.id ? (
                    <>
                      <Button size="small" onClick={handleSaveEdit}>Guardar</Button>
                      <Button size="small" onClick={handleCancelEdit}>Cancelar</Button>
                    </>
                  ) : (
                    <>
                      <Tooltip title="Editar descripción">
                        <IconButton size="small" onClick={() => handleEditClick(photo)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar foto">
                        <IconButton size="small" color="error" onClick={() => handleDeletePhoto(photo.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            p: 3,
            border: '2px dashed #ccc',
            borderRadius: 2,
            textAlign: 'center',
            bgcolor: '#f9f9f9'
          }}
        >
          <CameraAltIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Aún no hay fotos. Toma o sube una foto para comenzar.
          </Typography>
        </Box>
      )}

      {/* Diálogo para tomar fotos con la cámara */}
      <Dialog open={openCamera} onClose={handleCloseCamera} maxWidth="md" fullWidth>
        <DialogTitle>
          Tomar Foto
          <IconButton
            aria-label="close"
            onClick={handleCloseCamera}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCamera}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleCapturePhoto}
            startIcon={<CameraAltIcon />}
          >
            Capturar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para previsualizar fotos */}
      <Dialog open={!!previewPhoto} onClose={handleClosePreview} maxWidth="md" fullWidth>
        {previewPhoto && (
          <>
            <DialogTitle>
              {previewPhoto.description}
              <IconButton
                aria-label="close"
                onClick={handleClosePreview}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={previewPhoto.preview}
                  alt={previewPhoto.description}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Capturada: {new Date(previewPhoto.timestamp).toLocaleString()}
              </Typography>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PhotoCapture;