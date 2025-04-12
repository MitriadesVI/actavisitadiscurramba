// src/utils/StorageService.ts
import { FormData } from '../types';

const FORM_STORAGE_KEY = 'supervisorForm';
const FORMS_LIST_KEY = 'savedForms';

// Función para guardar un formulario con un ID único
export const saveFormToLocalStorage = (formData: Partial<FormData>, formId?: string): string => {
  try {
    // Si no se proporciona ID, generamos uno nuevo
    const id = formId || `form_${Date.now()}`;
    
    // Preparar objeto para guardar (excluir datos no serializables como archivos o firmas)
    const formToSave = {
      ...formData,
      id,
      lastSaved: new Date().toISOString(),
      // No almacenamos archivos grandes o datos binarios
      photos: formData.photos ? formData.photos.map(p => ({
        id: p.id,
        description: p.description,
        timestamp: p.timestamp,
        // No guardamos el archivo ni la vista previa
      })) : [],
      signature: null, // No guardar la firma, se captura al finalizar
    };
    
    // Guardar en localStorage
    localStorage.setItem(`${FORM_STORAGE_KEY}_${id}`, JSON.stringify(formToSave));
    
    // Actualizar lista de formularios guardados
    const savedForms = getSavedFormsList();
    if (!savedForms.includes(id)) {
      savedForms.push(id);
      localStorage.setItem(FORMS_LIST_KEY, JSON.stringify(savedForms));
    }
    
    return id;
  } catch (error) {
    console.error('Error al guardar formulario:', error);
    return '';
  }
};

// Obtener lista de formularios guardados
export const getSavedFormsList = (): string[] => {
  try {
    const savedForms = localStorage.getItem(FORMS_LIST_KEY);
    return savedForms ? JSON.parse(savedForms) : [];
  } catch (error) {
    console.error('Error al obtener lista de formularios:', error);
    return [];
  }
};

// Obtener un formulario guardado por ID
export const getFormFromLocalStorage = (formId: string): Partial<FormData> | null => {
  try {
    const formData = localStorage.getItem(`${FORM_STORAGE_KEY}_${formId}`);
    return formData ? JSON.parse(formData) : null;
  } catch (error) {
    console.error('Error al obtener formulario:', error);
    return null;
  }
};

// Eliminar un formulario
export const deleteFormFromLocalStorage = (formId: string): boolean => {
  try {
    // Eliminar formulario
    localStorage.removeItem(`${FORM_STORAGE_KEY}_${formId}`);
    
    // Actualizar lista
    const savedForms = getSavedFormsList().filter(id => id !== formId);
    localStorage.setItem(FORMS_LIST_KEY, JSON.stringify(savedForms));
    
    return true;
  } catch (error) {
    console.error('Error al eliminar formulario:', error);
    return false;
  }
};