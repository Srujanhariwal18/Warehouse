import { apiClient } from './client'
import type {
  AlertDetectionResponse,
  AlertResponse,
  PageResponse,
} from './types'

export class HttpAlertService {
  async getAlerts(
    status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED',
    severity?: 'CRITICAL' | 'WARNING' | 'INFO',
  ): Promise<AlertResponse[]> {
    const page = await apiClient.get<PageResponse<AlertResponse>>('/alerts', {
      status,
      severity,
      size: 50,
    })
    return page.content || []
  }

  async detectAlerts(): Promise<AlertDetectionResponse> {
    return apiClient.post<AlertDetectionResponse>('/alerts/detect')
  }

  async acknowledgeAlert(id: string): Promise<AlertResponse> {
    return apiClient.put<AlertResponse>(`/alerts/${id}/acknowledge`)
  }

  async resolveAlert(id: string): Promise<AlertResponse> {
    return apiClient.put<AlertResponse>(`/alerts/${id}/resolve`)
  }
}

export const httpAlertService = new HttpAlertService()
