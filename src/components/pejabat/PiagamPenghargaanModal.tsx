import React, { useRef } from 'react';
import { X, Printer, Award, Crown, Sparkles, CheckCircle2 } from 'lucide-react';
import { PiagamData } from '../../types/database';

interface PiagamPenghargaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PiagamData | null;
}

export const PiagamPenghargaanModal: React.FC<PiagamPenghargaanModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col border border-amber-200 animate-slide-up">
        {/* Toolbar Non-printable */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Pratinjau Piagam Penghargaan Resmi
              </h3>
              <p className="text-xs text-slate-400">
                Pemberian Apresiasi Resmi Kepala Sekolah SMPN 2 Glagah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Piagam (A4 Landscape)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Page */}
        <div className="p-8 sm:p-12 bg-amber-50/40 text-slate-900 print:p-4 print:bg-white flex flex-col items-center justify-center relative overflow-hidden" ref={printRef}>
          {/* Border Ornamen Sertifikat Emas */}
          <div className="w-full border-8 border-double border-amber-600/80 rounded-2xl p-6 sm:p-10 bg-white relative shadow-sm">
            {/* Background watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Award className="w-96 h-96 text-amber-900" />
            </div>

            {/* Header Sertifikat */}
            <div className="text-center space-y-1 relative z-10">
              <p className="text-xs sm:text-sm font-extrabold tracking-widest text-amber-800 uppercase">
                PEMERINTAH KABUPATEN BANYUWANGI • DINAS PENDIDIKAN
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight uppercase text-slate-900">
                SMP NEGERI 2 GLAGAH
              </h2>
              <p className="text-xs text-slate-500 pb-2">
                Program 7 Kebiasaan Anak Indonesia Hebat Kemendikdasmen RI
              </p>
              <div className="w-32 h-1 bg-amber-500 mx-auto rounded-full" />
            </div>

            {/* Judul Piagam */}
            <div className="text-center my-5 sm:my-6 relative z-10 space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black tracking-wider uppercase">
                {data.kategoriLabel || 'PIAGAM PENGHARGAAN KARAKTER'}
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-extrabold tracking-wider text-amber-900 uppercase">
                {data.judul || 'PIAGAM PENGHARGAAN'}
              </h1>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-500 font-mono">
                <span>Nomor: {data.nomorSurat}</span>
                <span>•</span>
                <span className="font-sans font-bold text-amber-800">{data.periodeLabel}</span>
              </div>
            </div>

            {/* Penerima */}
            <div className="text-center space-y-2.5 relative z-10 max-w-2xl mx-auto">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Diberikan dengan penuh rasa bangga dan apresiasi tertinggi kepada:
              </p>
              
              <div className="py-2 border-b-2 border-amber-400 inline-block px-8">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {data.diberikanKepada}
                </h3>
                {data.subPenerima && (
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {data.subPenerima}
                  </p>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium pt-2">
                {data.keterangan}{' '}
                {data.skor ? (
                  <span className="font-bold text-amber-900">({data.skor})</span>
                ) : null}.
              </p>
            </div>

            {/* Tanda Tangan Kepala Sekolah */}
            <div className="mt-8 sm:mt-10 flex justify-between items-end relative z-10 px-4 sm:px-12 text-xs">
              <div className="text-center space-y-1">
                <div className="w-20 h-20 rounded-full border-2 border-amber-400 bg-amber-50/80 flex flex-col items-center justify-center text-amber-800 font-black mx-auto shadow-xs">
                  <Crown className="w-6 h-6 text-amber-600 mb-0.5" />
                  <span className="text-[9px] uppercase tracking-wider">RESMI 7KAIH</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">SMPN 2 GLAGAH</p>
              </div>

              <div className="text-center space-y-12">
                <div>
                  <p className="text-slate-500">Glagah, {data.tanggal}</p>
                  <p className="font-bold text-slate-900">Kepala SMP Negeri 2 Glagah</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 underline underline-offset-4 text-sm">
                    {data.namaKepalaSekolah}
                  </p>
                  <p className="text-[11px] text-slate-500">NIP. {data.nipKepalaSekolah}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Toolbar Non-printable */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            Piagam dapat dicetak saat apel hari Senin untuk penyerahan piala bergilir kelas.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Piagam</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
