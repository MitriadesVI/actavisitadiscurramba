// src/components/Header.tsx
import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  useMediaQuery, 
  Menu, 
  MenuItem,
  Container,
  Divider,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { MAIN_LOGO_BASE64 } from '../assets/logos';

// Mapeo de secciones
const sections = [
  { id: 'info-general', label: 'Información General' },
  { id: 'detalles-evento', label: 'Detalles Evento' },
  { id: 'activaciones', label: 'Activaciones' },
  { id: 'geolocalizacion', label: 'Geolocalización' },
  { id: 'resultados', label: 'Resultados' },
  { id: 'evidencia', label: 'Evidencia' },
  { id: 'firma', label: 'Firma' },
];

interface HeaderProps {
  scrollToSection?: (sectionId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ scrollToSection }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Calcular dimensiones del logo - más grande para mejor visibilidad
  // Mantenemos la proporción original del logo (801x311)
  const logoDesiredHeight = isMobile ? 40 : 50;
  const logoWidth = (logoDesiredHeight * 801) / 311; // Mantener proporción exacta

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSectionClick = (sectionId: string) => {
    if (scrollToSection) {
      scrollToSection(sectionId);
    }
    setMobileOpen(false);
  };

  // Drawer para móviles
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          p: 2 
        }}
      >
        <Box 
          component="img"
          src={MAIN_LOGO_BASE64}
          alt="Logo"
          sx={{
            height: `${logoDesiredHeight}px`,
            width: `${logoWidth}px`
          }}
        />
      </Box>
      <Divider />
      <List>
        {sections.map((section) => (
          <ListItem 
            button 
            key={section.id} 
            onClick={() => handleSectionClick(section.id)}
            sx={{ 
              textAlign: 'center',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.08)',
              }
            }}
          >
            <ListItemText primary={section.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo y Título */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              component="img"
              src={MAIN_LOGO_BASE64}
              alt="Logo"
              sx={{
                height: `${logoDesiredHeight}px`,
                width: `${logoWidth}px`,
                mr: 2
              }}
            />
            <Typography
              variant={isMobile ? "h6" : "h5"}
              noWrap
              component="div"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              Supervisión de Eventos
            </Typography>
          </Box>

          {/* Menú de navegación */}
          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex' }}>
              {sections.map((section) => (
                <Button
                  key={section.id}
                  color="inherit"
                  onClick={() => handleSectionClick(section.id)}
                  sx={{ mx: 0.5 }}
                  size={isTablet ? "small" : "medium"}
                >
                  {section.label}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer móvil */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móviles
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
};

export default Header;