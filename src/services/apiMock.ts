// Service API mock pour le mode fallback quand le backend n'est pas disponible

import type { ApiResponse, ContactMessage } from './api';

// Données mock pour les messages de contact
const mockMessages: ContactMessage[] = [
  {
    id: "1",
    name: "Jean Dupont",
    email: "jean.dupont@email.com",
    company: "Tech Company",
    subject: "Demande de devis",
    message: "Bonjour, nous aimerions développer une application web...",
    status: "NOUVEAU",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockContactApi = {
  async sendMessage(message: ContactMessage): Promise<ApiResponse> {
    console.warn('Mode fallback: Message de contact enregistré localement');
    mockMessages.push({
      ...message,
      id: Date.now().toString(),
      status: "NOUVEAU",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      message: "Message envoyé avec succès (mode offline)"
    };
  },

  async getAllMessages(): Promise<ApiResponse<{ messages: ContactMessage[] }>> {
    return {
      success: true,
      data: { messages: mockMessages }
    };
  },

  async deleteMessage(id: string): Promise<ApiResponse> {
    const index = mockMessages.findIndex(m => m.id === id);
    if (index > -1) {
      mockMessages.splice(index, 1);
    }
    return {
      success: true,
      message: "Message supprimé (mode offline)"
    };
  },

  async updateMessageStatus(id: string, status: string): Promise<ApiResponse<{ message: ContactMessage }>> {
    const message = mockMessages.find(m => m.id === id);
    if (message) {
      message.status = status as any;
      message.updatedAt = new Date().toISOString();
      return {
        success: true,
        data: { message }
      };
    }
    throw new Error("Message non trouvé");
  }
};

export const mockHealthApi = {
  async checkHealth(): Promise<ApiResponse<{ status: string; timestamp: string; uptime: number }>> {
    return {
      success: true,
      data: {
        status: "OK (mode offline)",
        timestamp: new Date().toISOString(),
        uptime: 0
      }
    };
  }
};

export const mockUploadApi = {
  async uploadImage(file: File): Promise<ApiResponse<{ imageUrl: string; filename: string }>> {
    // Créer une URL temporaire pour l'aperçu
    const imageUrl = URL.createObjectURL(file);
    return {
      success: true,
      data: {
        imageUrl,
        filename: file.name
      }
    };
  }
};

// Fonction pour détecter si on est en mode fallback
export const isInFallbackMode = (): boolean => {
  return localStorage.getItem('api_fallback_mode') === 'true';
};

export const enableFallbackMode = (): void => {
  localStorage.setItem('api_fallback_mode', 'true');
  console.warn('Mode fallback activé - utilisation des données mock');
};

export const disableFallbackMode = (): void => {
  localStorage.removeItem('api_fallback_mode');
  console.info('Mode fallback désactivé');
};
