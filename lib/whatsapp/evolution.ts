/**
 * Evolution API Client for ChairPro SaaS.
 * Handles Multi-Tenant WhatsApp instances, QR code pairing, webhook subscriptions,
 * and sending text / voice messages.
 */

export interface EvolutionConfig {
  serverUrl: string; // e.g. "http://localhost:8080" or "https://evolution.tudominio.com"
  apiKey: string; // e.g. "CHAIRPRO_EVOLUTION_SECRET_KEY_2026"
}

export interface EvolutionInstanceResponse {
  instance: {
    instanceName: string;
    instanceId?: string;
    status: string;
    serverUrl?: string;
  };
  hash?: {
    apikey: string;
  };
  qrcode?: {
    pairingCode?: string;
    code?: string;
    base64?: string;
    count?: number;
  };
}

export interface EvolutionConnectionState {
  instance: {
    instanceName: string;
    state: 'open' | 'connecting' | 'close' | 'refused';
  };
}

export class EvolutionApiClient {
  private serverUrl: string;
  private apiKey: string;

  constructor(config?: Partial<EvolutionConfig>) {
    this.serverUrl = (config?.serverUrl || process.env.EVOLUTION_SERVER_URL || 'http://localhost:8080').replace(/\/$/, '');
    this.apiKey = config?.apiKey || process.env.EVOLUTION_API_KEY || 'CHAIRPRO_EVOLUTION_SECRET_KEY_2026';
  }

  private get headers(): Record<string, string> {
    return {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 1. Create a new WhatsApp Instance for a Barbershop
   */
  async createInstance(params: {
    instanceName: string;
    webhookUrl?: string;
  }): Promise<{ success: boolean; data?: EvolutionInstanceResponse; error?: string }> {
    try {
      const url = `${this.serverUrl}/instance/create`;
      const body = {
        instanceName: params.instanceName,
        token: `token_${params.instanceName}_${Date.now()}`,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        rejectCall: false,
        msgCall: 'Este número no recibe llamadas, por favor escribe por mensaje.',
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: false,
        webhook: params.webhookUrl
          ? {
              url: params.webhookUrl,
              byEvents: false,
              base64: true,
              events: [
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED',
              ],
            }
          : undefined,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.response?.message || data?.message || 'Error al crear la instancia' };
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'No se pudo conectar al servidor de Evolution API' };
    }
  }

  /**
   * 2. Fetch connection QR Code for an Instance
   */
  async getQRCode(instanceName: string): Promise<{
    success: boolean;
    qrBase64?: string;
    pairingCode?: string;
    code?: string;
    state?: string;
    error?: string;
  }> {
    try {
      const url = `${this.serverUrl}/instance/connect/${instanceName}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.message || 'Error al obtener código QR' };
      }

      return {
        success: true,
        qrBase64: data?.base64 || data?.qrcode?.base64,
        pairingCode: data?.pairingCode || data?.qrcode?.pairingCode,
        code: data?.code || data?.qrcode?.code,
        state: data?.instance?.state,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 3. Check Connection State ('open' = Connected, 'connecting', 'close')
   */
  async getConnectionState(instanceName: string): Promise<{
    success: boolean;
    state?: 'open' | 'connecting' | 'close' | 'refused';
    error?: string;
  }> {
    try {
      const url = `${this.serverUrl}/instance/connectionState/${instanceName}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.message || 'Error al consultar estado' };
      }

      return {
        success: true,
        state: data?.instance?.state || 'close',
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 4. Send Text Message to a WhatsApp Phone
   */
  async sendTextMessage(params: {
    instanceName: string;
    phone: string; // e.g. "573001234567" (country code + number)
    text: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Clean phone number (remove + and spaces)
      const cleanPhone = params.phone.replace(/\D/g, '');
      const url = `${this.serverUrl}/message/sendText/${params.instanceName}`;

      const body = {
        number: cleanPhone,
        options: {
          delay: 1000,
          presence: 'composing',
          linkPreview: true,
        },
        textMessage: {
          text: params.text,
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.message || 'Error al enviar mensaje' };
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 5. Logout / Disconnect WhatsApp Session
   */
  async logout(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.serverUrl}/instance/logout/${instanceName}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.headers,
      });

      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data?.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// Global Singleton instance
export const evolutionApi = new EvolutionApiClient();
