import { SunoGenerateRequest, SunoGenerateResponse, SunoTaskResponse } from "@/types/music";
import { toast } from "sonner";

const SUNO_API_KEY = import.meta.env.VITE_SUNO_API_KEY;
const SUNO_BASE_URL = "https://api.sunoapi.org";

// Validate API key exists
if (!SUNO_API_KEY) {
  // console.error("❌ VITE_SUNO_API_KEY is not set in environment variables");
}

class SunoService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${SUNO_BASE_URL}${endpoint}`;
    const requestOptions = {
      ...options,
      headers: {
        "Authorization": `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // console.error(`❌ Suno API Request failed:`, errorData);
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async generateMusic(params: SunoGenerateRequest): Promise<SunoGenerateResponse> {
    try {
      const requestData: SunoGenerateRequest = {
        ...params,
        callBackUrl: window.location.origin + "/api/suno-callback", // Callback URL untuk menerima hasil
      };

      const response = await this.makeRequest<SunoGenerateResponse>("/api/v1/generate", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to generate music");
      }

      return response;
    } catch (error) {
      // console.error("❌ Suno API Error:", error);
      // Don't show toast here, let the caller handle the error
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<SunoTaskResponse> {
    try {
      const response = await this.makeRequest<SunoTaskResponse>(`/api/v1/generate/record-info?taskId=${taskId}`);

      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to get task status");
      }

      return response;
    } catch (error) {
      // console.error("Suno Task Status Error:", error);
      throw error;
    }
  }

  async pollTaskCompletion(taskId: string, maxAttempts: number = 30): Promise<SunoTaskResponse> {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const response = await this.getTaskStatus(taskId);
          
          if (response.data.status === "SUCCESS") {
            resolve(response);
            return;
          }
          
          if (response.data.status.includes("FAILED") || response.data.status === "SENSITIVE_WORD_ERROR") {
            reject(new Error(response.data.errorMessage || "Generation failed"));
            return;
          }
          
          if (attempts >= maxAttempts) {
            reject(new Error("Generation timeout - please check status manually"));
            return;
          }
          
          // Poll every 10 seconds
          setTimeout(poll, 10000);
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }
}

export const sunoService = new SunoService();