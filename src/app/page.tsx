'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Download,
  Bot,
  RefreshCw,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Sliders,
  FileSpreadsheet,
  Terminal,
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react';
function formatRupiah(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0';
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function DashboardPage() {
  const [urlInput, setUrlInput] = useState('');
  const [markupPercent, setMarkupPercent] = useState<number>(15);
  const [fixedMargin, setFixedMargin] = useState<number>(2500);
  const [isScraping, setIsScraping] = useState(false);
  const [products, setProducts] = useState<ShopeeProductMapping[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ShopeeProductMapping | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [currentLogs, setCurrentLogs] = useState<string[]>([]);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showBrowserWindow, setShowBrowserWindow] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'ready' | 'published'>('all');

  // Preset demo URLs
  const sampleUrls = [
    {
      name: 'TWS Bluetooth Earphone V5.3',
      url: 'https://www.jakmall.com/tws-audio/tws-bluetooth-53-wireless-earphone-waterproof',
    },
    {
      name: 'Smartwatch IP68 Heart Rate',
      url: 'https://www.jakmall.com/wearables/smartwatch-fitness-tracker-ip68-waterproof',
    },
    {
      name: 'Fast Charging Cable Type-C 65W',
      url: 'https://www.jakmall.com/gadget-acc/kabel-data-type-c-to-type-c-65w-braided',
    },
  ];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) {
      showToast('Masukkan URL produk JakMall terlebih dahulu.', 'error');
      return;
    }

    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          markupPercent,
          fixedMargin,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Produk JakMall berhasil diekstraksi & dinormalisasi!');
        setUrlInput('');
        fetchProducts();
      } else {
        showToast(data.error || 'Gagal mengekstrak produk.', 'error');
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsScraping(false);
    }
  };

  const handlePublishBot = async (product: ShopeeProductMapping) => {
    setIsPublishing(true);
    setCurrentLogs([`[${new Date().toLocaleTimeString()}] Memulai inisialisasi Playwright Bot...`]);
    setCurrentScreenshot(null);
    setIsLogModalOpen(true);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          method: 'PLAYWRIGHT_BOT',
          headless: !showBrowserWindow,
        }),
      });

      const data: PublishResult = await res.json();
      if (data.success) {
        setCurrentLogs(data.logs || []);
        if (data.screenshotUrl) setCurrentScreenshot(data.screenshotUrl);
        showToast('Berhasil memproses listing via Shopee Bot!');
        fetchProducts();
      } else {
        setCurrentLogs(data.logs || [data.message || 'Terjadi kegagalan']);
        showToast(data.message || 'Gagal menjalankan bot automasi.', 'error');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setCurrentLogs((prev) => [...prev, `[ERROR] ${error.message}`]);
      showToast('Gagal menghubungi service automation.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadExcel = (productId?: string) => {
    const url = productId ? `/api/export-excel?id=${productId}` : '/api/export-excel';
    window.open(url, '_blank');
    showToast('File template Shopee Mass Upload sedang diunduh.');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini dari daftar staging?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      showToast('Produk dihapus.');
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedProduct),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Perubahan produk berhasil disimpan!');
        setIsEditModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      showToast('Gagal menyimpan perubahan.', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'ready') return p.status === 'EXTRACTED' || p.status === 'REVIEWED';
    if (activeTab === 'published') return p.status === 'PUBLISHED';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  JakMall ➔ Shopee Automation Hub
                </h1>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Shopee: aryafajarn9</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PoC Assessment — Buruh Ketik Candidate Test
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://seller.shopee.co.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/80 border border-orange-700/60 text-orange-300 hover:bg-orange-900/80 transition-colors text-xs font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shopee Seller Portal</span>
            </a>
            <button
              onClick={() => handleDownloadExcel()}
              disabled={products.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/80 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export All (Shopee Excel)</span>
            </button>
            <button
              onClick={fetchProducts}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Section: Extraction Box & Price Rules */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* URL Input Form (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <h2 className="text-base font-semibold text-slate-100">Ekstraksi Produk JakMall</h2>
            </div>

            <form onSubmit={handleScrape} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Tempel URL katalog/produk JakMall (cth: https://www.jakmall.com/...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={isScraping}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengekstrak...</span>
                    </>
                  ) : (
                    <>
                      <span>Ekstrak & Normalisasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Sample Quick Pick Buttons for Demo */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">Contoh Demo:</span>
                {sampleUrls.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setUrlInput(s.url)}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Pricing & Normalization Settings (1 Col) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-semibold text-slate-100">Aturan Markup & Bot Demo</h2>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Margin Keuntungan (%)</span>
                    <span className="font-semibold text-orange-400">{markupPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Biaya Admin / Packaging Tambahan (Rp)</span>
                    <span className="font-semibold text-amber-400">Rp {formatRupiah(fixedMargin)}</span>
                  </div>
                  <input
                    type="number"
                    step="500"
                    value={fixedMargin}
                    onChange={(e) => setFixedMargin(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Visible Window Toggle for Local Live Demo */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Buka Jendela Chrome Fisik (Local Demo)</span>
                  <input
                    type="checkbox"
                    checked={showBrowserWindow}
                    onChange={(e) => setShowBrowserWindow(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-4 border-t border-slate-800/80 pt-3">
              Rumus: <code>(Harga Modal × (1 + {markupPercent}%)) + Rp {formatRupiah(fixedMargin)}</code>
            </p>
          </div>
        </section>

        {/* Product Staging Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold text-slate-100">Staging Area & Hasil Pemetaan</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {products.length} Produk
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('ready')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'ready' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Siap Upload ({products.filter((p) => p.status === 'EXTRACTED' || p.status === 'REVIEWED').length})
              </button>
              <button
                onClick={() => setActiveTab('published')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'published'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Terupload ({products.filter((p) => p.status === 'PUBLISHED').length})
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-300">Belum Ada Produk di Staging</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Masukkan URL katalog JakMall pada form di atas atau klik salah satu tombol contoh demo untuk memulai ekstraksi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Image Header & Status Badge */}
                    <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                      <img
                        src={p.mainImage}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold backdrop-blur-md shadow-md ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-500/80 text-white border border-emerald-400/40'
                              : p.status === 'UPLOADING'
                              ? 'bg-amber-500/80 text-white border border-amber-400/40'
                              : p.status === 'FAILED'
                              ? 'bg-red-500/80 text-white border border-red-400/40'
                              : 'bg-blue-500/80 text-white border border-blue-400/40'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-slate-300 font-mono">
                        {p.sku}
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-semibold text-sm text-slate-100 line-clamp-2" title={p.title}>
                        {p.title}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Harga Asli JakMall</span>
                          <span className="font-medium text-slate-300">
                            Rp {formatRupiah(p.basePrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Harga Jual Shopee</span>
                          <span className="font-bold text-orange-400">
                            Rp {formatRupiah(p.finalPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>Stok: <strong className="text-slate-200">{p.stock}</strong></span>
                        <span>Berat: <strong className="text-slate-200">{p.weightGrams} gr</strong></span>
                        <span>Varian: <strong className="text-slate-200">{p.variations?.[0]?.options?.length || 0}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Review & Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadExcel(p.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
                        title="Download Shopee Mass Upload (Excel)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-red-400 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handlePublishBot(p)}
                      disabled={isPublishing}
                      className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Publish Bot</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Technical Architecture & Assessment Notes Section */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-slate-200">Arsitektur & Ketentuan Teknis Penilaian</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
              <h4 className="font-semibold text-orange-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Multi-Tier Scraper
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Menggabungkan Fast Axios/Cheerio untuk ekstraksi JSON-LD/OpenGraph + Playwright Chromium fallback untuk rendering dinamis secara 100% gratis.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
              <h4 className="font-semibold text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Smart Normalizer
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Memetakan field JakMall ke standar Shopee: markup margin dinamis, sanitasi judul (max 120 char), formatting deskripsi terstruktur, dan penanganan variasi.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
              <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Dual Publishing Engine
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Mendukung eksekusi via Playwright Browser Automation (dengan bukti screenshot logging) serta ekspor template resmi Shopee Mass Upload (.xlsx).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Edit Product Modal */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-slate-100">Review & Edit Data Produk Shopee</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-200">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Nama Produk (Shopee)</label>
                <input
                  type="text"
                  value={selectedProduct.title}
                  onChange={(e) =>
                    setSelectedProduct({ ...selectedProduct, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    value={selectedProduct.basePrice}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        basePrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Harga Jual Shopee (Rp)</label>
                  <input
                    type="number"
                    value={selectedProduct.finalPrice}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        finalPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-orange-400 font-bold focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Berat (Gram)</label>
                  <input
                    type="number"
                    value={selectedProduct.weightGrams}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        weightGrams: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Deskripsi Lengkap</label>
                <textarea
                  rows={6}
                  value={selectedProduct.description}
                  onChange={(e) =>
                    setSelectedProduct({ ...selectedProduct, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-orange-500 focus:outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Automation & Execution Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Shopee Automation Bot — Live Execution Logs
                </h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 font-mono text-xs">
              {/* Terminal Logs */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 space-y-1.5 max-h-60 overflow-y-auto">
                {currentLogs.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {line}
                  </div>
                ))}
                {isPublishing && (
                  <div className="flex items-center gap-2 text-orange-400 pt-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sedang menjalankan automasi browser Playwright...</span>
                  </div>
                )}
              </div>

              {/* Proof Screenshot */}
              {currentScreenshot && (
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 font-sans">
                    <ImageIcon className="w-4 h-4 text-emerald-400" /> Bukti Hasil Eksekusi (Proof of Result):
                  </span>
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={currentScreenshot}
                      alt="Verification Proof"
                      className="w-full h-auto object-cover max-h-80"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Tutup Konsol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-700/60'
              : 'bg-red-950/90 text-red-200 border border-red-700/60'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
