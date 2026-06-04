import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Megaphone,
  Wallet,
  ShoppingBag,
  FileWarning,
  HeartHandshake,
  ShieldAlert,
  ChevronRight,
  CalendarDays,
  HandCoins,
  Users,
  MapPin,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useApiQuery } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatRupiah, formatDate, unitToString } from '@/lib/format'
import StatusChip from '@/components/ui/StatusChip'
import type {
  Announcement,
  Campaign,
  CommunityEvent,
  Complaint,
  Dues,
  Obituary,
  Product,
} from '@/types'

interface DashboardData {
  dues: Dues[]
  latestAnnouncement: Announcement | null
  latestObituary: Obituary | null
  nextEvent: CommunityEvent | null
  activeCampaign: Campaign | null
  latestProducts: Product[]
  activeComplaint: Complaint | null
}

export default function Dashboard() {
  const { user } = useApp()
  const { data, loading } = useApiQuery<DashboardData>(() =>
    api.get<DashboardData>('/dashboard')
  )

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-hairline border-t-primary" />
      </div>
    )
  }

  const unpaid = data.dues.filter((d) => d.status === 'Belum Bayar')
  const totalUnpaid = unpaid.reduce((s, d) => s + d.jumlah, 0)

  return (
    <div className="space-y-lg">
      {/* Greeting (mobile) */}
      <div className="desktop:hidden">
        <h1 className="text-display-lg text-ink">
          Halo, {user?.nama.split(' ')[0]}
        </h1>
        <p className="text-body-sm text-muted">
          Unit {user && unitToString(user.unit)} · {user?.status}
        </p>
      </div>

      {/* Emergency banner */}
      <Link
        to="/panic"
        className="flex items-center justify-between rounded-md bg-primary px-base py-base text-white shadow-float transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-md">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-title-md">Panic Button</p>
            <p className="text-body-sm text-white/85">Tekan untuk keadaan darurat</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5" />
      </Link>

      {/* Tagihan aktif */}
      <section>
        <SectionTitle title="Tagihan Aktif" to="/iuran" />
        <div className="card-float p-base">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-muted">Total belum dibayar</p>
              <p className="mt-xxs text-display-md text-ink">
                {formatRupiah(totalUnpaid)}
              </p>
            </div>
            <Link to="/iuran" className="btn-primary px-base">Bayar</Link>
          </div>
          {unpaid.length > 0 && (
            <div className="mt-base space-y-sm border-t border-hairline-soft pt-base">
              {unpaid.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <Wallet className="h-4 w-4 text-muted" />
                    <span className="text-body-sm text-ink">
                      {d.jenis} · {d.periode}
                    </span>
                  </div>
                  <span className="text-body-sm font-semibold text-ink">
                    {formatRupiah(d.jumlah)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick access grid */}
      <section>
        <h2 className="mb-md text-title-md text-ink">Akses Cepat</h2>
        <div className="grid grid-cols-4 gap-sm sm:grid-cols-6 desktop:grid-cols-8">
          <QuickLink to="/pengumuman" icon={Megaphone} label="Pengumuman" />
          <QuickLink to="/iuran" icon={Wallet} label="Iuran" />
          <QuickLink to="/marketplace" icon={ShoppingBag} label="Pasar" />
          <QuickLink to="/event" icon={CalendarDays} label="Event" />
          <QuickLink to="/voting" icon={Users} label="Voting" />
          <QuickLink to="/crowdfunding" icon={HandCoins} label="Donasi" />
          <QuickLink to="/pengaduan" icon={FileWarning} label="Pengaduan" />
          <QuickLink to="/berita-duka" icon={HeartHandshake} label="Duka" />
        </div>
      </section>

      {/* Event terdekat & campaign aktif */}
      <div className="grid gap-lg desktop:grid-cols-2">
        {data.nextEvent && (
          <section>
            <SectionTitle title="Event Terdekat" to="/event" />
            <Link
              to="/event"
              className="card block overflow-hidden transition-shadow hover:shadow-float"
            >
              {data.nextEvent.foto && (
                <img
                  src={data.nextEvent.foto}
                  alt={data.nextEvent.nama}
                  className="aspect-[3/1] w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-base">
                <h3 className="text-title-md text-ink">{data.nextEvent.nama}</h3>
                <p className="mt-xxs flex items-center gap-xs text-body-sm text-muted">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(data.nextEvent.tanggal)} · {data.nextEvent.waktu}
                </p>
                <p className="mt-xxs flex items-center gap-xs text-body-sm text-muted">
                  <MapPin className="h-4 w-4" />
                  {data.nextEvent.lokasi}
                </p>
              </div>
            </Link>
          </section>
        )}

        {data.activeCampaign && (
          <section>
            <SectionTitle title="Campaign Aktif" to="/crowdfunding" />
            <Link
              to="/crowdfunding"
              className="card block p-base transition-shadow hover:shadow-float"
            >
              <h3 className="text-title-md text-ink">{data.activeCampaign.judul}</h3>
              <div className="mt-md h-2 overflow-hidden rounded-full bg-surface-strong">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      (data.activeCampaign.terkumpul / data.activeCampaign.target) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-sm flex items-baseline justify-between">
                <span className="text-title-sm font-semibold text-ink">
                  {formatRupiah(data.activeCampaign.terkumpul)}
                </span>
                <span className="text-caption-sm text-muted">
                  dari {formatRupiah(data.activeCampaign.target)}
                </span>
              </div>
            </Link>
          </section>
        )}
      </div>

      {/* Two-column content on desktop */}
      <div className="grid gap-lg desktop:grid-cols-2">
        {data.latestAnnouncement && (
          <section>
            <SectionTitle title="Pengumuman Terbaru" to="/pengumuman" />
            <Link
              to="/pengumuman"
              className="card block p-base transition-shadow hover:shadow-float"
            >
              <div className="mb-sm flex items-center gap-sm">
                <StatusChip
                  label={data.latestAnnouncement.kategori}
                  tone={
                    data.latestAnnouncement.kategori === 'Darurat'
                      ? 'danger'
                      : data.latestAnnouncement.kategori === 'Penting'
                        ? 'warning'
                        : 'info'
                  }
                />
                <span className="text-caption-sm text-muted">
                  {formatDate(data.latestAnnouncement.tanggal)}
                </span>
              </div>
              <h3 className="text-title-md text-ink">{data.latestAnnouncement.judul}</h3>
              <p className="mt-xxs line-clamp-2 text-body-sm text-body">
                {data.latestAnnouncement.isi}
              </p>
            </Link>
          </section>
        )}

        {data.latestObituary && (
          <section>
            <SectionTitle title="Berita Duka" to="/berita-duka" />
            <Link
              to="/berita-duka"
              className="card block p-base transition-shadow hover:shadow-float"
            >
              <p className="text-caption-sm text-muted">Inna lillahi wa inna ilaihi raji'un</p>
              <h3 className="mt-xxs text-title-md text-ink">
                {data.latestObituary.namaAlmarhum}
              </h3>
              <p className="mt-xxs text-body-sm text-body">
                Unit {data.latestObituary.unit} · {data.latestObituary.jadwalPemakaman}
              </p>
            </Link>
          </section>
        )}
      </div>

      {/* Marketplace terbaru */}
      {data.latestProducts.length > 0 && (
        <section>
          <SectionTitle title="Marketplace Terbaru" to="/marketplace" />
          <div className="-mx-base flex gap-base overflow-x-auto px-base pb-xs no-scrollbar desktop:mx-0 desktop:grid desktop:grid-cols-4 desktop:overflow-visible desktop:px-0">
            {data.latestProducts.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/marketplace"
                className="w-40 shrink-0 desktop:w-auto"
              >
                <div className="overflow-hidden rounded-md">
                  <img
                    src={p.foto}
                    alt={p.nama}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="mt-sm line-clamp-1 text-title-sm text-ink">{p.nama}</p>
                <p className="text-body-sm font-semibold text-ink">
                  {formatRupiah(p.harga)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Status pengaduan */}
      {data.activeComplaint && (
        <section>
          <SectionTitle title="Status Pengaduan" to="/pengaduan" />
          <Link
            to="/pengaduan"
            className="card flex items-center justify-between p-base transition-shadow hover:shadow-float"
          >
            <div>
              <h3 className="text-title-sm text-ink">{data.activeComplaint.judul}</h3>
              <p className="mt-xxs text-body-sm text-muted">
                {data.activeComplaint.kategori}
              </p>
            </div>
            <StatusChip
              label={data.activeComplaint.status}
              tone={data.activeComplaint.status === 'Diproses' ? 'warning' : 'info'}
            />
          </Link>
        </section>
      )}
    </div>
  )
}

function SectionTitle({ title, to }: { title: string; to: string }) {
  return (
    <div className="mb-md flex items-center justify-between">
      <h2 className="text-title-md text-ink">{title}</h2>
      <Link
        to={to}
        className="flex items-center gap-xxs text-body-sm text-muted hover:text-ink"
      >
        Lihat semua <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: typeof Megaphone
  label: string
}) {
  return (
    <Link to={to} className="flex flex-col items-center gap-xs text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-surface-soft transition-colors hover:bg-surface-strong">
        <Icon className="h-6 w-6 text-ink" strokeWidth={1.8} />
      </div>
      <span className="text-caption-sm text-body">{label}</span>
    </Link>
  )
}
