export type Role =
  | 'super_admin'
  | 'pengelola'
  | 'petugas_keuangan'
  | 'petugas_keamanan'
  | 'warga'

export interface AuthedResident {
  id: string
  role: Role
  nama: string
  blok: string
  lantai: string
  nomor_unit: string
}
