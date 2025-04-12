// src/utils/PDFGenerator.ts
import jsPDF from 'jspdf';
import { FormData, PhotoData } from '../types';
import { MAIN_LOGO_BASE64, LOGO_DIMENSIONS } from '../assets/logos';

export class PDFGenerator {
  private pdf: jsPDF;
  private margin: { top: number; bottom: number; left: number; right: number };
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;
  private y: number;
  private lineHeight: number;
  private fieldIndent: number;
  private footerHeight: number;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.margin = { top: 15, bottom: 15, left: 15, right: 15 };
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.margin.left - this.margin.right;
    this.y = this.margin.top;
    this.lineHeight = 7;
    this.fieldIndent = this.margin.left + 55;
    this.footerHeight = 10;
    
    // Añadir fuentes si es necesario
    this.pdf.setFont('helvetica');
  }

  private async addHeader(): Promise<void> {
    // Encabezado con fondo azul
    this.pdf.setFillColor(25, 118, 210); // Azul primario
    this.pdf.rect(0, 0, this.pageWidth, 30, 'F'); // Aumentamos la altura del encabezado
    
    // Título en blanco
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(18); // Aumentamos tamaño del título
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('INFORME DE SUPERVISIÓN DE EVENTO', this.pageWidth / 2, 18, { align: 'center' });
    
    // Restablecer colores
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    
    // Calcular dimensiones del logo respetando la proporción original
    // El logo original tiene dimensiones de 801x311
    const aspectRatio = 801 / 311; // ~2.58
    const logoWidth = 60; // Anchura del logo en mm (aumentada)
    const logoHeight = logoWidth / aspectRatio;
    
    try {
      // Posicionar el logo bajo el encabezado azul, centrado
      const logoX = (this.pageWidth - logoWidth) / 2;
      const logoY = 35; // Posición Y justo debajo del encabezado azul
      
      this.pdf.addImage(
        MAIN_LOGO_BASE64,
        'PNG',
        logoX,
        logoY,
        logoWidth,
        logoHeight
      );
      
      // Línea decorativa bajo el logo
      this.pdf.setDrawColor(25, 118, 210); // Azul primario
      this.pdf.setLineWidth(0.5);
      this.pdf.line(this.margin.left, logoY + logoHeight + 5, this.pageWidth - this.margin.right, logoY + logoHeight + 5);
      
      // Actualizar la posición Y para el contenido posterior
      this.y = logoY + logoHeight + 15; // Margen extra después del logo
    } catch (error) {
      console.error("Error al añadir el logo al PDF:", error);
      this.y = 35; // Posición de respaldo si falla el logo
    }
  }

  private addFooter(pageNumber: number, totalPages: number): void {
    const footerY = this.pageHeight - this.margin.bottom;
    
    // Línea superior del pie de página
    this.pdf.setDrawColor(25, 118, 210); // Azul primario (para coherencia con el encabezado)
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin.left, footerY - 5, this.pageWidth - this.margin.right, footerY - 5);
    
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(100, 100, 100);
    
    // Fecha de generación
    const today = new Date().toLocaleDateString();
    this.pdf.text(`Generado el: ${today}`, this.margin.left, footerY);
    
    // Número de página (CORREGIDO)
    this.pdf.text(`Página ${pageNumber} de ${totalPages}`, this.pageWidth - this.margin.right, footerY, { align: 'right' });
    
    // Logo pequeño en el pie de página (opcional - si se desea un branding sutil)
    try {
      const smallLogoWidth = 20; // Ancho del logo pequeño en mm
      const smallLogoHeight = smallLogoWidth / (801 / 311); // Mantener proporción
      
      const logoX = (this.pageWidth - smallLogoWidth) / 2;
      const logoY = footerY - smallLogoHeight - 2;
      
      // Descomenta estas líneas si quieres incluir el logo también en el pie de página
      /*
      this.pdf.addImage(
        MAIN_LOGO_BASE64,
        'PNG',
        logoX,
        logoY,
        smallLogoWidth,
        smallLogoHeight
      );
      */
    } catch (error) {
      console.error("Error al añadir el logo al pie de página:", error);
    }
  }

  private checkPageBreak(): void {
    if (this.y > this.pageHeight - this.margin.bottom - this.footerHeight) {
      // No añadimos el pie de página durante la creación de contenido,
      // solo añadimos la nueva página
      this.pdf.addPage();
      this.addHeader();
    }
  }

  private addSectionTitle(title: string): void {
    this.checkPageBreak();
    this.y += this.lineHeight * 0.5;
    
    // Estilo visual para los títulos de sección
    this.pdf.setFillColor(240, 240, 250); // Fondo muy suave
    this.pdf.rect(this.margin.left, this.y - 7, this.contentWidth, 14, 'F');
    
    // Líneas horizontales superior e inferior
    this.pdf.setDrawColor(25, 118, 210); // Azul primario
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin.left, this.y - 7, this.pageWidth - this.margin.right, this.y - 7);
    this.pdf.line(this.margin.left, this.y + 7, this.pageWidth - this.margin.right, this.y + 7);
    
    this.pdf.setTextColor(25, 118, 210); // Texto en azul para combinar
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.text(title, this.margin.left + 5, this.y + 1); // Centrado vertical mejorado
    
    this.pdf.setTextColor(0, 0, 0); // Volver a texto negro
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    this.y += this.lineHeight * 2.5;
  }

  // Resto del código igual que en tu implementación original...

  // Añadir una sección en formato tabla mejorado
  private addTableSection(sectionTitle: string, data: { label: string; value: string | undefined | null }[]): void {
    this.addSectionTitle(sectionTitle);
    
    // Definir columnas
    const labelWidth = this.contentWidth * 0.35; // 35% del ancho para etiquetas
    const valueWidth = this.contentWidth * 0.65; // 65% del ancho para valores
    const cellPadding = 3; // Padding dentro de celdas
    
    // Coordenadas iniciales
    let startX = this.margin.left;
    let startY = this.y;
    
    // Dibujar rectángulo exterior de la tabla
    this.pdf.setDrawColor(180, 180, 180);
    this.pdf.setLineWidth(0.3);
    
    // Primera pasada: calcular alturas de filas
    let currentY = startY;
    
    // Procesamos cada fila
    data.forEach((row, index) => {
      // CORREGIDO: Manejar textos largos para etiquetas y valores
      const labelText = row.label;
      const valueText = row.value || 'N/A';
      
      // Dividir las etiquetas largas en múltiples líneas si es necesario
      const labelLines = this.pdf.splitTextToSize(labelText, labelWidth - (cellPadding * 2));
      const valueLines = this.pdf.splitTextToSize(valueText, valueWidth - (cellPadding * 2));
      
      // Calcular altura necesaria
      const labelHeight = labelLines.length * this.lineHeight;
      const valueHeight = valueLines.length * this.lineHeight;
      const maxTextHeight = Math.max(labelHeight, valueHeight);
      
      // Altura final de la fila con padding
      const rowHeight = Math.max(maxTextHeight + (cellPadding * 2), this.lineHeight + (cellPadding * 2));
      
      // Comprobar cambio de página
      if (currentY + rowHeight > this.pageHeight - this.margin.bottom - this.footerHeight) {
        // Cerrar tabla actual
        this.pdf.rect(startX, startY, this.contentWidth, currentY - startY, 'D');
        
        // Nueva página
        this.pdf.addPage();
        this.addHeader();
        
        // Reiniciar coordenadas
        currentY = this.y;
        startY = this.y;
      }
      
      // Pintar fondo de fila alternando colores
      this.pdf.setFillColor(index % 2 === 0 ? 245 : 255, index % 2 === 0 ? 245 : 255, index % 2 === 0 ? 245 : 255);
      this.pdf.rect(startX, currentY, this.contentWidth, rowHeight, 'F');
      
      // Línea vertical divisoria
      this.pdf.line(startX + labelWidth, currentY, startX + labelWidth, currentY + rowHeight);
      
      // Línea horizontal inferior (excepto última fila)
      if (index < data.length - 1) {
        this.pdf.line(startX, currentY + rowHeight, startX + this.contentWidth, currentY + rowHeight);
      }
      
      // Etiquetas - CORREGIDO para manejar múltiples líneas
      this.pdf.setFont('helvetica', 'bold');
      
      if (labelLines.length === 1) {
        // Centrar verticalmente si es una sola línea
        const labelY = currentY + (rowHeight / 2) + (this.lineHeight / 2) - 2;
        this.pdf.text(labelLines, startX + cellPadding, labelY);
      } else {
        // Distribuir desde arriba con padding si son múltiples líneas
        labelLines.forEach((line, lineIndex) => {
          const y = currentY + cellPadding + (lineIndex * this.lineHeight) + this.lineHeight;
          this.pdf.text(line, startX + cellPadding, y);
        });
      }
      
      // Valores - CORREGIDO para mejor alineación
      this.pdf.setFont('helvetica', 'normal');
      
      if (valueLines.length === 1) {
        // Centrar verticalmente si es una sola línea
        const valueY = currentY + (rowHeight / 2) + (this.lineHeight / 2) - 2;
        this.pdf.text(valueLines, startX + labelWidth + cellPadding, valueY);
      } else {
        // Distribuir desde arriba con padding si son múltiples líneas
        valueLines.forEach((line, lineIndex) => {
          const y = currentY + cellPadding + (lineIndex * this.lineHeight) + this.lineHeight;
          this.pdf.text(line, startX + labelWidth + cellPadding, y);
        });
      }
      
      // Actualizar posición Y
      currentY += rowHeight;
    });
    
    // Dibujar rectángulo exterior completo
    this.pdf.rect(startX, startY, this.contentWidth, currentY - startY, 'D');
    
    // Actualizar posición Y global
    this.y = currentY + 5; // Espacio después de la tabla
  }

  // Conservar los métodos originales addPhotosSection y addSignatureSection...
  
  private async addPhotosSection(photos: PhotoData[]): Promise<void> {
    if (!photos || photos.length === 0) {
      return;
    }
    
    this.addSectionTitle('EVIDENCIA FOTOGRÁFICA');
    
    // Estilo consistente con el resto de la tabla
    const cellPadding = 3;
    const photoWidth = 80;
    
    let totalHeight = 0;
    
    for (const photo of photos) {
      try {
        // Comprobar cambio de página
        if (this.y + photoWidth + 30 > this.pageHeight - this.margin.bottom) {
          this.pdf.addPage();
          this.addHeader();
        }
        
        const fileReader = new FileReader();
        const filePromise = new Promise<string | ArrayBuffer | null>((resolve, reject) => {
          fileReader.onload = () => resolve(fileReader.result);
          fileReader.onerror = reject;
          fileReader.readAsDataURL(photo.file);
        });
        
        const imageData = await filePromise;
        if (imageData) {
          const imgProps = this.pdf.getImageProperties(imageData as string);
          const imgHeight = (imgProps.height * photoWidth) / imgProps.width;
          
          // Crear un contenedor para la foto y su descripción
          const containerX = this.margin.left;
          const containerY = this.y;
          const containerWidth = this.contentWidth;
          const containerHeight = imgHeight + 30; // Altura imagen + espacio para texto
          
          // Fondo blanco para el contenedor
          this.pdf.setFillColor(255, 255, 255);
          this.pdf.setDrawColor(180, 180, 180);
          this.pdf.rect(containerX, containerY, containerWidth, containerHeight, 'FD');
          
          // Añadir imagen
          this.pdf.addImage(imageData as string, 'JPEG', containerX + 5, containerY + 5, photoWidth, imgHeight);
          
          // Añadir descripción
          this.pdf.setFontSize(10);
          this.pdf.setFont('helvetica', 'bold');
          this.pdf.text('Descripción:', containerX + photoWidth + 10, containerY + 15);
          this.pdf.setFont('helvetica', 'normal');
          this.pdf.text(photo.description || 'N/A', containerX + photoWidth + 40, containerY + 15);
          
          this.pdf.setFont('helvetica', 'bold');
          this.pdf.text('Fecha:', containerX + photoWidth + 10, containerY + 25);
          this.pdf.setFont('helvetica', 'normal');
          this.pdf.text(new Date(photo.timestamp).toLocaleString(), containerX + photoWidth + 40, containerY + 25);
          
          // Actualizar posición Y
          this.y += containerHeight + 5;
          totalHeight += containerHeight + 5;
        }
      } catch (error) {
        console.error("Error procesando imagen:", error);
      }
    }
    
    this.pdf.setFontSize(11);
    this.y += this.lineHeight;
  }

  // Método mejorado para la firma
  private async addSignatureSection(data: FormData): Promise<void> {
    this.addSectionTitle('FIRMA DEL SUPERVISOR');
    
    const signatureBoxWidth = 100;
    const signatureBoxHeight = 60;
    
    if (data.signature) {
      try {
        const imgProps = this.pdf.getImageProperties(data.signature);
        const sigWidth = 70;
        const sigHeight = (imgProps.height * sigWidth) / imgProps.width;
        
        if (this.y + sigHeight + 20 > this.pageHeight - this.margin.bottom) {
          this.pdf.addPage();
          this.addHeader();
        }
        
        // Contenedor para la firma
        const containerX = this.margin.left;
        const containerY = this.y;
        
        // Agregar la imagen de la firma
        this.pdf.addImage(data.signature, 'PNG', containerX, containerY, sigWidth, sigHeight);
        this.y += sigHeight + 5;
        
        // Nombre y cargo
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(`${data.nombreSupervisor}`, containerX, this.y);
        this.y += this.lineHeight;
        
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text(`${data.cargoSupervisor || 'Supervisor'}`, containerX, this.y);
      } catch (error) {
        console.error("Error añadiendo firma al PDF:", error);
        this.pdf.text('Error al cargar la firma.', this.margin.left, this.y);
      }
    } else {
      // Si no hay firma, mostrar un recuadro para firma manual
      this.pdf.setDrawColor(100, 100, 100);
      this.pdf.rect(this.margin.left, this.y, signatureBoxWidth, signatureBoxHeight);
      this.y += signatureBoxHeight + 5;
      this.pdf.text('_________________________', this.margin.left, this.y);
      this.y += this.lineHeight;
      this.pdf.text(`${data.nombreSupervisor}`, this.margin.left, this.y);
      this.y += this.lineHeight;
      this.pdf.text('(Pendiente de firma digital)', this.margin.left, this.y);
    }
    
    this.y += this.lineHeight * 2;
  }

  // Mantener el método generatePDF como en el original
  public async generatePDF(data: FormData): Promise<void> {
    try {
      // Crear PDF con contenido pero SIN pies de página (cambio crucial)
      await this.addHeader();
      
      this.addTableSection('INFORMACIÓN GENERAL', [
        { label: 'Fecha Visita:', value: data.fechaVisita },
        { label: 'Lugar Visita:', value: data.lugarVisita },
        { label: 'Supervisor:', value: data.nombreSupervisor },
        { label: 'Cargo:', value: data.cargoSupervisor },
        { label: 'Valor Patrocinio:', value: data.valorPatrocinio }
      ]);
      
      // Sección: Geolocalización
      let geoLocationText = 'No obtenida';
      if (data.geolocation.lat && data.geolocation.lon) {
        geoLocationText = `Lat: ${data.geolocation.lat.toFixed(5)}, Lon: ${data.geolocation.lon.toFixed(5)}`;
        if (data.geolocation.timestamp) {
          geoLocationText += `\nTimestamp: ${new Date(data.geolocation.timestamp).toLocaleString()}`;
        }
        
        // Añadir información de dirección si está disponible
        if (data.direccionAproximada) {
          geoLocationText += `\nDirección aproximada: ${data.direccionAproximada}`;
        }
        
        if (data.barrio) {
          geoLocationText += `\nBarrio: ${data.barrio}`;
        }
        
        if (data.direccionManual) {
          geoLocationText += `\nDirección detallada: ${data.direccionManual}`;
        }
      }
      
      this.addTableSection('GEOLOCALIZACIÓN', [
        { label: 'Ubicación:', value: geoLocationText }
      ]);
      
      // Sección: Detalles del Evento
      this.addTableSection('DETALLES DEL EVENTO', [
        { label: 'Exclusividad Ventas/Visibilidad:', value: data.exclusividadVentasVisibilidad },
        { label: 'Nombre del Artista (s) y Hora de Presentación:', value: data.artista },
        { label: 'Codificación y/o Disponibilidad Producto:', value: data.disponibilidadProducto },
        { label: 'Compromiso Compra:', value: data.compromisoCompra },
        { label: 'Aforo:', value: data.aforo }
      ]);
      
      // Sección: Activaciones y Visibilidad
      this.addTableSection('ACTIVACIONES Y VISIBILIDAD', [
        { label: 'Visibilidad Marca:', value: data.visibilidadMarca },
        { label: 'Activación Marca:', value: data.activacionMarca },
        { label: 'Momento Marca:', value: data.momentoMarca }
      ]);
      
      // Sección: Resultados y Observaciones
      this.addTableSection('RESULTADOS Y OBSERVACIONES', [
        { label: 'Reporte de Ventas:', value: data.reporteVentas },
        { label: 'Observaciones Generales:', value: data.observacionesGenerales }
      ]);
      
      // Sección: Evidencia Fotográfica
      await this.addPhotosSection(data.photos);
      
      // Sección: Firma
      await this.addSignatureSection(data);
      
      // PASO 1: Calcular el número total de páginas
      const totalPages = this.pdf.getNumberOfPages();
      
      // PASO 2: Añadir pies de página a todas las páginas con el número total correcto
      for (let i = 1; i <= totalPages; i++) {
        this.pdf.setPage(i);
        this.addFooter(i, totalPages); // Ahora pasamos el número total correcto
      }
      
      // Guardar PDF
      this.pdf.save(`Acta_Supervisión_${data.fechaVisita}_${data.lugarVisita.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      
    } catch (error) {
      console.error("Error generando el PDF:", error);
      throw error;
    }
  }
}

export default PDFGenerator;