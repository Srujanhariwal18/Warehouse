import { apiClient } from './client'
import type { DashboardSummaryResponse } from './types'

export class HttpDashboardService {
  async getSummary(): Promise<DashboardSummaryResponse> {
    return apiClient.get<DashboardSummaryResponse>('/dashboard/summary')
  }
}

export const httpDashboardService = new HttpDashboardService()
