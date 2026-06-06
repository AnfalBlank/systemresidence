import type { DuesType } from '@/types'

export interface DuesSetting {
  jenis: DuesType
  enabled: boolean
  defaultAmount: number
  dueDay: number
  deskripsi: string
}

export interface PaymentSettings {
  bankName: string
  bankAccountNumber: string
  bankAccountHolder: string
  qrisImageUrl: string
  paymentNote: string
}

export interface ExpenseCategory {
  id: string
  nama: string
}
