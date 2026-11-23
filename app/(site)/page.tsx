import Link from "next/link";
import { BarList } from "@/components/charts/charts";
import { Brand } from "@/components/ui/brand";

const SCORE = [
  { label: "Pengalaman", value: 25 },
  { label: "Kinerja", value: 25 },
  { label: "Waktu", value: 15 },
  { label: "Kapasitas", value: 15 },
  { label: "Harga", value: 10 },
  { label: "Wilayah", value: 10 },
];

const SAMPLE = [
  { rank: 1, name: "CV Teknik Mandiri", score: 70, note: "Sertifikat K3 dan SBU berlaku sampai proyek selesai" },
  { rank: 2, name: "PT Karya Bangun", score: 64, note: "Kapasitas tersisa 1 proyek" },
  { rank: 3, name: "CV Maju Konstruksi", score: 58, note: "Belum pernah dinilai di proyek kota" },
];

const STEPS = [
  { title: "Cek siapa yang siap", text: "Pilih proyek. Sistem memeriksa semua vendor terhadap syarat wajibnya: status, kategori, tenaga, sertifikat, dan jadwal." },
  { title: "Bandingkan skornya", text: "Vendor yang lolos diberi skor 0 sampai 100. Yang gugur tetap tercatat, lengkap dengan alasannya." },
  { title: "Ajukan, lalu diputuskan", text: "Admin atau PIC mengajukan penugasan. Kepala Dinas menyetujui atau menolaknya. Tidak ada yang berubah sebelum itu." },
];

const ROLES = [
  ["Admin Pengadaan", "mendaftarkan vendor, memeriksa dokumennya, dan mengajukan penugasan."],
  ["PIC Proyek", "mencari vendor untuk proyek di dinasnya sendiri."],
  ["Kepala Dinas", "membaca usulan dan memutuskannya."],
  ["Vendor", "mengisi data perusahaan dan mengunggah dokumen."],
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-text">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Brand tone="light" />
        <Link href="/login" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-table font-medium text-primary transition-colors hover:bg-primary-soft">
          Masuk
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 pt-10 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:pt-16">
          <div>
            <h1 className="max-w-xl text-[2.5rem] leading-[3rem] font-semibold text-navy">
              Pilih vendor berdasarkan data, bukan ingatan.
            </h1>
            <p className="mt-5 max-w-lg text-body text-muted">
              Pemkot-AI membantu bagian pengadaan menemukan vendor yang benar-benar siap untuk sebuah proyek. Setiap penugasan tetap diputuskan Kepala Dinas.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/login" className="inline-flex h-12 items-center rounded-md bg-primary px-6 font-medium text-surface transition-colors hover:bg-navy">
                Masuk
              </Link>
              <span className="text-table text-muted">Versi demo. Semua data fiktif.</span>
            </div>
          </div>

          <figure className="rounded-lg border border-line bg-bg p-5" aria-label="Contoh peringkat vendor">
            <figcaption className="text-table text-muted">
              Renovasi Gedung Dinas, 3 vendor siap
            </figcaption>
            <ol className="mt-4 divide-y divide-line rounded-md border border-line bg-surface">
              {SAMPLE.map((item) => (
                <li key={item.name} className="flex items-start gap-4 p-4">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded bg-primary-soft text-table font-semibold text-navy tabular-nums">
                    {item.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy">{item.name}</p>
                    <p className="text-caption text-muted">{item.note}</p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="text-card font-semibold text-navy tabular-nums">{item.score}</span>
                    <span className="text-caption text-muted"> / 100</span>
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-caption text-muted">Contoh tampilan. Skor dan alasannya dihitung dari data, bukan ditulis oleh AI.</p>
          </figure>
        </section>

        <section className="border-t border-line bg-bg">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <h2 className="text-section font-semibold text-navy">Begini cara kerjanya</h2>
            <ol className="space-y-8">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-table font-semibold text-navy tabular-nums">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-card font-semibold text-navy">{step.title}</h3>
                    <p className="mt-1 max-w-xl text-body text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div>
            <h2 className="text-section font-semibold text-navy">Skor dihitung dari enam hal</h2>
            <p className="mt-2 text-body text-muted">Bobotnya tetap dan terlihat. Siapa pun bisa memeriksa kenapa sebuah vendor mendapat skornya.</p>
          </div>
          <div className="max-w-xl">
            <BarList rows={SCORE.map((item) => ({ label: item.label, value: item.value, display: `${item.value} poin` }))} max={25} />
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <h2 className="text-section font-semibold text-navy">Siapa memakainya</h2>
            <dl className="divide-y divide-line">
              {ROLES.map(([name, text]) => (
                <div key={name} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr]">
                  <dt className="font-medium text-navy">{name}</dt>
                  <dd className="text-muted">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-line bg-navy">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-12">
            <p className="max-w-lg text-section font-semibold text-surface">Coba sendiri dengan akun demo.</p>
            <Link href="/login" className="inline-flex h-12 items-center rounded-md bg-surface px-6 font-medium text-navy transition-colors hover:bg-primary-soft">
              Masuk
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-6 py-5 text-caption text-muted">
        <div className="mx-auto w-full max-w-6xl">Versi demo. Seluruh data bersifat fiktif.</div>
      </footer>
    </div>
  );
}
