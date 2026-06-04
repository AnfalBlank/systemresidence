import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapProduct } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

const productSelect = `
  SELECT p.*, r.nama as seller_nama, r.no_hp as seller_hp, r.blok as seller_blok, r.lantai as seller_lantai, r.nomor_unit as seller_nomor
  FROM products p
  JOIN residents r ON r.id = p.seller_id
`

router.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const result = await db.execute(`${productSelect} ORDER BY p.created_at DESC`)
    res.json(result.rows.map(mapProduct))
  })
)

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        nama: z.string().min(1),
        foto: z.string().url().optional().or(z.literal('')),
        harga: z.number().nonnegative(),
        stok: z.number().int().nonnegative(),
        deskripsi: z.string().optional(),
        kategori: z.string().min(1),
      })
      .parse(req.body)
    const id = newId('p')
    await db.execute({
      sql: 'INSERT INTO products (id, seller_id, nama, foto, harga, stok, deskripsi, kategori) VALUES (?,?,?,?,?,?,?,?)',
      args: [
        id,
        req.user!.id,
        body.nama,
        body.foto || null,
        body.harga,
        body.stok,
        body.deskripsi ?? '',
        body.kategori,
      ],
    })
    const result = await db.execute({
      sql: `${productSelect} WHERE p.id = ?`,
      args: [id],
    })
    res.status(201).json(mapProduct(result.rows[0]))
  })
)

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: 'SELECT seller_id FROM products WHERE id = ?',
      args: [req.params.id],
    })
    const row = result.rows[0]
    if (!row) return res.status(404).json({ error: 'Not found' })
    if (
      String(row.seller_id) !== req.user!.id &&
      !['super_admin', 'pengelola'].includes(req.user!.role)
    ) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [req.params.id] })
    res.json({ ok: true })
  })
)

// Place order
router.post(
  '/orders',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        productId: z.string(),
        jumlah: z.number().int().positive().default(1),
      })
      .parse(req.body)
    const productResult = await db.execute({
      sql: 'SELECT harga, stok FROM products WHERE id = ?',
      args: [body.productId],
    })
    const product = productResult.rows[0]
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' })
    if (Number(product.stok) < body.jumlah)
      return res.status(400).json({ error: 'Stok tidak cukup' })

    const id = newId('o')
    const total = Number(product.harga) * body.jumlah
    await db.execute({
      sql: 'INSERT INTO orders (id, product_id, buyer_id, jumlah, total) VALUES (?,?,?,?,?)',
      args: [id, body.productId, req.user!.id, body.jumlah, total],
    })
    await db.execute({
      sql: 'UPDATE products SET stok = stok - ? WHERE id = ?',
      args: [body.jumlah, body.productId],
    })
    res.status(201).json({ id, total, status: 'Menunggu Pembayaran' })
  })
)

// My orders
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: `SELECT o.*, p.nama as product_nama FROM orders o JOIN products p ON p.id = o.product_id WHERE o.buyer_id = ? ORDER BY o.created_at DESC`,
      args: [req.user!.id],
    })
    res.json(
      result.rows.map((row) => ({
        id: String(row.id),
        productId: String(row.product_id),
        productName: String(row.product_nama),
        jumlah: Number(row.jumlah),
        total: Number(row.total),
        status: String(row.status),
      }))
    )
  })
)

export default router
