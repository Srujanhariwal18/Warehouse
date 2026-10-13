import { apiClient } from './client'
import type {
  BackendStockTransactionResponse,
  InventoryValuationSummaryResponse,
  PageResponse,
} from './types'

export class HttpReportService {
  async getValuationReport(
    warehouseId?: string,
  ): Promise<InventoryValuationSummaryResponse> {
    return apiClient.get<InventoryValuationSummaryResponse>(
      '/reports/valuation',
      warehouseId ? { warehouseId } : undefined,
    )
  }

  async getMovementsReport(): Promise<BackendStockTransactionResponse[]> {
    const page = await apiClient.get<
      PageResponse<BackendStockTransactionResponse>
    >('/reports/stock-movements', { size: 100 })
    return page.content || []
  }
}

export const httpReportService = new HttpReportService()
