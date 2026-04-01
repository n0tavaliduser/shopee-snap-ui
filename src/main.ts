import './style.css'
import logoUrl from './assets/fonts/logo.png'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  link?: string
  name?: string
  price?: string
  rating?: string
  img?: string
  shipping?: string
  location?: string
}

interface ScrapeResponse {
  status: string
  keyword: string
  total_results: number
  total_time?: number
  scraped_at?: string
  data?: Product[]
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatTime(secondsNum: number): string {
  const totalSeconds = Math.round(secondsNum)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  const parts = []
  if (h > 0) parts.push(`${h} jam`)
  if (m > 0) parts.push(`${m} menit`)
  if (s > 0 || (h === 0 && m === 0)) parts.push(`${s} detik`)

  return parts.join(' ')
}

interface SelectOption {
  value: string
  label: string
}

interface FieldConfig {
  key: keyof Product
  canonical: string
  label: string
}

// All displayable fields with their scraper key → config canonical map → label mapping
const ALL_FIELDS: FieldConfig[] = [
  { key: 'name', canonical: 'product_name', label: 'Nama Produk' },
  { key: 'price', canonical: 'price', label: 'Harga' },
  { key: 'rating', canonical: 'rating', label: 'Rating' },
  { key: 'location', canonical: 'location', label: 'Lokasi' },
  // { key: 'shipping', canonical: 'shipping', label: 'Ongkir' }, // Comment out / disable until stable
  { key: 'img', canonical: 'image_url', label: 'Gambar' },
  { key: 'link', canonical: 'url', label: 'URL' },
]

// ─── App State ────────────────────────────────────────────────────────────────
type ViewMode = 'grid' | 'table'

const state = {
  viewMode: 'table' as ViewMode,
  // default visible fields
  visibleFields: new Set<string>(['name', 'price', 'link']),
  configOpen: false,
  localQuery: '',
  localSortKey: null as string | null,
  localSortDir: 'asc' as 'asc' | 'desc',
  currentPage: 1,
  pageSize: 10,
}

// ─── Custom Select Component ───────────────────────────────────────────────────
class CustomSelect {
  private wrapper: HTMLElement
  private trigger: HTMLButtonElement
  private dropdown: HTMLElement
  private options: SelectOption[]
  private selected: SelectOption
  private isOpen = false
  private onChange: (val: string) => void

  constructor(
    container: HTMLElement,
    options: SelectOption[],
    defaultValue: string,
    onChange: (val: string) => void
  ) {
    this.options = options
    this.onChange = onChange
    this.selected = options.find(o => o.value === defaultValue) ?? options[0]

    this.wrapper = document.createElement('div')
    this.wrapper.className = 'relative w-full'

    this.trigger = document.createElement('button') as HTMLButtonElement
    this.trigger.type = 'button'
    this.trigger.className = [
      'flex items-center justify-between gap-1.5 w-full px-2.5 md:px-3 py-1.5 rounded-md border border-gray-200',
      'bg-white text-sm text-gray-700 font-medium cursor-pointer flex-shrink-0 min-w-0',
      'hover:border-orange-400 hover:text-orange-600 transition-all select-none',
      'focus:outline-none focus:ring-2 focus:ring-orange-500/30',
    ].join(' ')

    this.dropdown = document.createElement('div')
    this.dropdown.className = [
      'absolute z-50 top-full mt-1 left-0 min-w-full',
      'bg-white rounded-md border border-gray-200 shadow-lg overflow-hidden',
      'hidden',
    ].join(' ')

    this.options.forEach(opt => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = [
        'w-full text-left px-3 py-2 text-sm transition-colors whitespace-nowrap',
        'hover:bg-orange-50 hover:text-orange-600 cursor-pointer',
        opt.value === this.selected.value ? 'text-orange-600 font-semibold bg-orange-50/50' : 'text-gray-700',
      ].join(' ')
      item.textContent = opt.label
      item.addEventListener('click', () => this.select(opt))
      this.dropdown.appendChild(item)
    })

    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggle()
    })

    document.addEventListener('click', () => this.close())

    this.wrapper.appendChild(this.trigger)
    this.wrapper.appendChild(this.dropdown)
    container.appendChild(this.wrapper)

    this.renderTrigger()
  }

  private renderTrigger() {
    this.trigger.innerHTML = `
      <span class="truncate text-left" style="min-width: 0;">${this.selected.label}</span>
      <svg class="w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${this.isOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
      </svg>
    `
  }

  private select(opt: SelectOption) {
    this.selected = opt
    this.onChange(opt.value)
    this.close()
    this.renderTrigger()
    Array.from(this.dropdown.children).forEach((child, i) => {
      const el = child as HTMLElement
      const isActive = this.options[i].value === opt.value
      el.className = [
        'w-full text-left px-3 py-2 text-sm transition-colors whitespace-nowrap',
        'hover:bg-orange-50 hover:text-orange-600 cursor-pointer',
        isActive ? 'text-orange-600 font-semibold bg-orange-50/50' : 'text-gray-700',
      ].join(' ')
    })
  }

  private toggle() { this.isOpen ? this.close() : this.open() }
  private open() { this.isOpen = true; this.dropdown.classList.remove('hidden'); this.renderTrigger() }
  private close() { this.isOpen = false; this.dropdown.classList.add('hidden'); this.renderTrigger() }
  getValue() { return this.selected.value }
}

// ─── App Markup ───────────────────────────────────────────────────────────────
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <!-- Sidebar Backdrop -->
  <div id="sidebar-backdrop" class="fixed inset-0 bg-gray-900/50 z-40 hidden opacity-0 transition-opacity duration-300"></div>
  
  <!-- Sidebar -->
  <div id="sidebar-panel" class="fixed top-0 left-0 h-full w-72 md:w-80 bg-white shadow-2xl z-50 transform -translate-x-full transition-transform duration-300 flex flex-col">
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
      <h2 class="font-bold text-gray-800 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Riwayat Scrape
      </h2>
      <button id="sidebar-close" class="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-md transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div id="history-content" class="flex-1 overflow-y-auto p-4 space-y-2.5">
       <div class="text-center text-gray-400 text-xs py-8">Memuat riwayat...</div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-4 py-8 md:py-10">

    <!-- Header Card -->
    <div class="mb-6 p-4 md:p-5 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-between w-full transition-all">
      
      <!-- Brand & Title Group -->
      <div class="flex items-center gap-3 md:gap-4">
        <!-- Orange Logo Background Box (Desktop) -->
        <div class="p-2 bg-orange-50/80 border border-orange-100/50 rounded-xl shrink-0 hidden sm:flex items-center justify-center">
           <img src="${logoUrl}" alt="Shopee Logo" class="h-7 w-auto object-contain drop-shadow-sm" />
        </div>
        
        <!-- Title & Subtitle Stack -->
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <!-- Inline Logo (Mobile) -->
            <img src="${logoUrl}" alt="Shopee Logo" class="h-5 w-auto object-contain sm:hidden" />
            <h1 class="text-base md:text-[19px] font-bold text-gray-900 leading-tight tracking-tight">Shopee Scraper</h1>
          </div>
          <p class="text-[11px] md:text-xs text-gray-500 font-medium leading-none mt-1">Ekstraksi data produk shopee</p>
        </div>
      </div>

      <!-- Sidebar Toggle Action Group -->
      <div class="flex items-center gap-3">
        <div class="h-6 w-px bg-gray-200 hidden md:block mx-2 opacity-70"></div>
        
        <button type="button" id="sidebar-open" class="group flex items-center gap-2 p-2 md:px-3 md:py-2 text-[13px] text-gray-600 hover:text-orange-600 hover:bg-orange-50 active:bg-orange-100 border border-gray-200 hover:border-orange-200 rounded-lg transition-all font-semibold shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20" aria-label="Buka riwayat">
          <svg class="w-4 h-4 md:w-[18px] md:h-[18px] shrink-0 text-orange-500 transition-transform duration-300 group-hover:-rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="hidden md:inline tracking-wide">Riwayat</span>
        </button>
      </div>

    </div>

    <!-- Search Bar -->
    <form id="scrape-form">
      <div class="flex flex-col md:flex-row md:items-center gap-2 p-1.5 md:p-1.5 p-2 bg-white rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-400 transition-all">

        <!-- Keyword & Config Row (Top on mobile) -->
        <div class="flex items-center w-full md:flex-1 gap-2 px-2 py-1 md:py-0 relative">
          <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" id="keyword" required placeholder="Cari produk..."
            class="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none py-1.5 whitespace-nowrap overflow-hidden text-ellipsis"/>
            
          <!-- Config toggle (Moved to search row for better mobile UI) -->
          <button type="button" id="config-toggle"
            class="flex items-center whitespace-nowrap flex-shrink-0 gap-1 md:px-2.5 px-2 py-1.5 rounded-md border border-gray-200 bg-gray-50 md:bg-white text-xs text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-all font-medium ml-1">
            <svg class="w-4 h-4 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
            <span class="hidden md:inline">Config</span>
          </button>
        </div>

        <div class="hidden md:block h-6 w-px bg-gray-200 flex-shrink-0"></div>

        <!-- Controls -->
        <div class="flex items-center gap-1.5 flex-wrap md:flex-nowrap w-full md:w-auto mt-1 md:mt-0 px-1 md:px-0 pb-1 md:pb-0">

          <!-- Controls Group (Max, Sort) -->
          <div class="flex items-center gap-1.5 w-full md:w-auto mt-1 md:mt-0 pb-1.5 md:pb-0">
            <!-- Max Products -->
            <div class="flex items-center gap-1 px-2 py-1.5 rounded-md border border-gray-200 bg-gray-50 flex-shrink-0 whitespace-nowrap w-[72px] md:w-auto">
              <span class="text-xs text-gray-400 select-none hidden md:inline">maks</span>
              <input type="number" id="max_products" value="3" min="1" max="75"
                class="w-full bg-transparent text-gray-700 text-sm md:text-center text-left outline-none font-medium" title="Max produk" style="-moz-appearance: textfield;"/>
            </div>

            <!-- Sort By -->
            <div id="sort-select-container" class="flex-1 md:flex-none min-w-0"></div>
            <!-- Sort Order -->
            <div id="sort-order-container" class="flex-1 md:flex-none min-w-0"></div>
          </div>

          <!-- Submit -->
          <button type="submit" id="submit-btn"
            class="flex items-center justify-center whitespace-nowrap flex-shrink-0 gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold px-4 py-1.5 rounded-md transition-all w-full md:w-auto mt-1.5 md:mt-0">
            <svg id="loading-spinner" class="hidden animate-spin w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span id="btn-label">Scrape</span>
          </button>
        </div>
      </div>
    </form>

    <!-- Config Panel (collapsible) -->
    <div id="config-panel" class="hidden mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div class="flex flex-wrap gap-6">

        <!-- View mode -->
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tampilan</p>
          <div class="flex gap-1.5">
            <button type="button" id="view-grid"
              class="view-btn flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all bg-white text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-600">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
              Grid
            </button>
            <button type="button" id="view-table"
              class="view-btn flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all bg-orange-500 text-white border-orange-500">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3z"/>
              </svg>
              Tabel
            </button>
          </div>
        </div>

        <!-- Field toggles -->
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Kolom yang ditampilkan</p>
          <div id="field-toggles" class="flex flex-wrap gap-1.5"></div>
        </div>

      </div>

      <!-- Konfirmasi Tutup Config -->
      <div class="mt-4 pt-3 border-t border-gray-100 flex justify-end">
        <button type="button" id="config-close-btn" class="px-5 py-1.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-semibold rounded-md transition-all">
          Selesai
        </button>
      </div>
    </div>

    <!-- Results meta -->
    <div id="results-meta" class="hidden mt-4 items-center justify-between flex-wrap gap-2">
      <p id="results-count" class="text-xs text-gray-400"></p>
      
      <!-- Local Search Filter -->
      <div class="relative w-full sm:w-auto mt-2 sm:mt-0">
        <svg class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" id="local-search" placeholder="Filter hasil..." class="w-full sm:w-60 pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 shadow-sm transition-all"/>
      </div>
    </div>

    <!-- Results area -->
    <div id="results" class="mt-3"></div>

    <!-- Pagination Controls -->
    <div id="pagination-controls" class="mt-5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 hidden w-full">
      <div class="flex justify-between items-center w-full sm:w-auto gap-3 sm:gap-4">
        <div id="page-size-container" class="w-[120px] sm:w-32 z-20"></div>
        <span id="page-info" class="text-[11px] sm:text-xs text-gray-500 font-medium"></span>
      </div>
      
      <div class="w-full sm:w-auto flex items-center bg-white border border-gray-200 p-0.5 rounded-md shadow-sm">
        <button id="page-prev" class="flex-1 sm:flex-none px-4 py-1.5 rounded text-xs font-semibold transition-all select-none text-center">Prev</button>
        <div id="page-numbers" class="flex items-center justify-center min-w-[3.5rem] px-2 text-xs text-gray-500 font-medium select-none"></div>
        <button id="page-next" class="flex-1 sm:flex-none px-4 py-1.5 rounded text-xs font-semibold transition-all select-none text-center">Next</button>
      </div>
    </div>

  </div>

  <!-- Progress Toast -->
  <div id="progress-toast" class="fixed bottom-4 right-4 left-4 md:left-auto md:w-[320px] bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-4 transform transition-transform duration-300 translate-y-[200%] z-50 pointer-events-none">
    <div class="flex items-center justify-between mb-2">
      <span id="toast-status" class="text-xs font-semibold text-gray-700 truncate max-w-[75%]">Memulai browser...</span>
      <span id="toast-pct" class="text-xs font-bold text-orange-600">0%</span>
    </div>
    <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
      <div id="toast-fill" class="bg-orange-500 h-1.5 rounded-full transition-all duration-300 ease-out" style="width: 0%"></div>
    </div>
    <div class="text-right">
      <span id="toast-eta" class="text-[10px] text-gray-400 font-medium whitespace-nowrap">ETA: Menghitung...</span>
    </div>
  </div>
`

// ─── DOM Elements ─────────────────────────────────────────────────────────────
const form = document.getElementById('scrape-form') as HTMLFormElement
const resultsDiv = document.getElementById('results') as HTMLDivElement
const resultsMeta = document.getElementById('results-meta') as HTMLDivElement
const resultsCount = document.getElementById('results-count') as HTMLParagraphElement
const localSearchInput = document.getElementById('local-search') as HTMLInputElement
const paginationControls = document.getElementById('pagination-controls') as HTMLDivElement
const pageSizeContainer = document.getElementById('page-size-container') as HTMLDivElement
const pageInfo = document.getElementById('page-info') as HTMLSpanElement
const pagePrev = document.getElementById('page-prev') as HTMLButtonElement
const pageNext = document.getElementById('page-next') as HTMLButtonElement
const pageNumbers = document.getElementById('page-numbers') as HTMLDivElement
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement
const spinner = document.getElementById('loading-spinner') as HTMLElement
const btnLabel = document.getElementById('btn-label') as HTMLElement
const sortSelectEl = document.getElementById('sort-select-container') as HTMLElement
const sortOrderEl = document.getElementById('sort-order-container') as HTMLElement
const configToggleBtn = document.getElementById('config-toggle') as HTMLButtonElement
const configPanel = document.getElementById('config-panel') as HTMLDivElement
const configCloseBtn = document.getElementById('config-close-btn') as HTMLButtonElement
const fieldToggles = document.getElementById('field-toggles') as HTMLDivElement
const viewGridBtn = document.getElementById('view-grid') as HTMLButtonElement
const viewTableBtn = document.getElementById('view-table') as HTMLButtonElement

const toastDiv = document.getElementById('progress-toast') as HTMLDivElement
const toastStatus = document.getElementById('toast-status') as HTMLElement
const toastFill = document.getElementById('toast-fill') as HTMLElement
const toastPct = document.getElementById('toast-pct') as HTMLElement
const toastEta = document.getElementById('toast-eta') as HTMLElement

const sidebarBackdrop = document.getElementById('sidebar-backdrop') as HTMLDivElement
const sidebarPanel = document.getElementById('sidebar-panel') as HTMLDivElement
const sidebarOpenBtn = document.getElementById('sidebar-open') as HTMLButtonElement
const sidebarCloseBtn = document.getElementById('sidebar-close') as HTMLButtonElement
const historyContent = document.getElementById('history-content') as HTMLDivElement

// ─── ETA Countdown State ──────────────────────────────────────────────────────
let etaInterval: number | null = null
let currentEtaSec: number = 0

function startEtaCountdown(sec: number) {
  if (etaInterval) window.clearInterval(etaInterval)
  currentEtaSec = sec
  updateEtaUI()

  etaInterval = window.setInterval(() => {
    if (currentEtaSec > 0) {
      currentEtaSec--
      updateEtaUI()
    } else {
      if (etaInterval) window.clearInterval(etaInterval)
      toastEta.textContent = 'Hampir selesai...'
    }
  }, 1000)
}

function updateEtaUI() {
  toastEta.textContent = `Sisa waktu: ${currentEtaSec}s`
  toastEta.classList.remove('invisible')
}

// ─── Sort Selects ─────────────────────────────────────────────────────────────
const sortBySelect = new CustomSelect(sortSelectEl, [
  { value: 'sales', label: 'Terlaris' },
  { value: 'relevancy', label: 'Relevansi' },
  { value: 'ctime', label: 'Terbaru' },
  { value: 'price', label: 'Harga' },
], 'price', (val) => {
  val === 'price'
    ? sortOrderEl.classList.remove('hidden')
    : sortOrderEl.classList.add('hidden')
})

const sortOrderSelect = new CustomSelect(sortOrderEl, [
  { value: 'asc', label: '↑ Termurah' },
  { value: 'desc', label: '↓ Termahal' },
], 'asc', () => { })

// ─── Pagination Select & Bindings ─────────────────────────────────────────────
new CustomSelect(pageSizeContainer, [
  { value: '10', label: '10 baris' },
  { value: '20', label: '20 baris' },
  { value: '50', label: '50 baris' },
  { value: '100', label: '100 baris' },
], '10', (val) => {
  state.pageSize = parseInt(val, 10);
  state.currentPage = 1;
  triggerRender();
})

pagePrev.addEventListener('click', () => {
  if (pagePrev.classList.contains('cursor-not-allowed')) return;
  state.currentPage--;
  triggerRender();
});

pageNext.addEventListener('click', () => {
  if (pageNext.classList.contains('cursor-not-allowed')) return;
  state.currentPage++;
  triggerRender();
});

// ─── Config Panel ─────────────────────────────────────────────────────────────

configToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  state.configOpen = !state.configOpen
  configPanel.classList.toggle('hidden', !state.configOpen)
  configToggleBtn.classList.toggle('border-orange-400', state.configOpen)
  configToggleBtn.classList.toggle('text-orange-600', state.configOpen)
})

// Tombol Selesai untuk menutup Config Panel
configCloseBtn.addEventListener('click', () => {
  state.configOpen = false
  configPanel.classList.add('hidden')
  configToggleBtn.classList.remove('border-orange-400', 'text-orange-600')
})

// View mode buttons
function setViewMode(mode: ViewMode) {
  state.viewMode = mode
  const isGrid = mode === 'grid'
  viewGridBtn.className = `view-btn flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${isGrid ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-600'}`
  viewTableBtn.className = `view-btn flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${!isGrid ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-600'}`
  // Re-render if data exists
  triggerRender()
}

viewGridBtn.addEventListener('click', () => setViewMode('grid'))
viewTableBtn.addEventListener('click', () => setViewMode('table'))

// Filter / Sort Listeners
localSearchInput.addEventListener('input', (e) => {
  state.localQuery = (e.target as HTMLInputElement).value
  state.currentPage = 1 // Reset pagination upon search
  triggerRender()
})

resultsDiv.addEventListener('click', (e) => {
  const th = (e.target as HTMLElement).closest('th[data-sort]') as HTMLElement
  if (!th) return

  const key = th.dataset.sort!
  if (state.localSortKey === key) {
    if (state.localSortDir === 'asc') state.localSortDir = 'desc'
    else state.localSortKey = null
  } else {
    state.localSortKey = key
    state.localSortDir = 'asc'
  }
  triggerRender()
})

// Field toggle chips
function renderFieldToggles() {
  fieldToggles.innerHTML = ''
  ALL_FIELDS.forEach(({ key, label }) => {
    const active = state.visibleFields.has(key)
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = `px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-400 border-gray-200 hover:border-orange-400'}`
    chip.textContent = label
    chip.addEventListener('click', () => {
      if (state.visibleFields.has(key)) {
        if (state.visibleFields.size <= 1) return // keep at least 1
        state.visibleFields.delete(key)
      } else {
        state.visibleFields.add(key)
      }
      renderFieldToggles()
      triggerRender()
    })
    fieldToggles.appendChild(chip)
  })
}
renderFieldToggles()

// ─── Sidebar Logic ────────────────────────────────────────────────────────────

function openSidebar() {
  sidebarBackdrop.classList.remove('hidden')
  requestAnimationFrame(() => {
    sidebarBackdrop.classList.remove('opacity-0')
    sidebarPanel.classList.remove('-translate-x-full')
  })
  loadHistory()
}

function closeSidebar() {
  sidebarBackdrop.classList.add('opacity-0')
  sidebarPanel.classList.add('-translate-x-full')
  setTimeout(() => sidebarBackdrop.classList.add('hidden'), 300)
}

sidebarOpenBtn.addEventListener('click', openSidebar)
sidebarCloseBtn.addEventListener('click', closeSidebar)
sidebarBackdrop.addEventListener('click', closeSidebar)

async function loadHistory() {
  historyContent.innerHTML = `<div class="text-center text-gray-400 text-xs py-10 flex flex-col items-center justify-center gap-3">
    <svg class="animate-spin w-5 h-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    Memuat riwayat...
  </div>`

  try {
    const baseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000'
    const res = await fetch(`${baseUrl}/history`)
    const data = await res.json()
    if (data.status === 'success' && data.history.length > 0) {
      historyContent.innerHTML = data.history.map((h: any) => {
        let dateStr = ''
        if (h.scraped_at) {
          const dt = new Date(h.scraped_at)
          dateStr = dt.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }).replace(/\./g, ':')
        }
        return `
          <div class="p-3 bg-gray-50 border border-gray-100 hover:bg-orange-50 hover:border-orange-200 rounded-lg cursor-pointer transition-colors group" data-filename="${h.filename}">
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-semibold text-sm text-gray-800 group-hover:text-orange-600 truncate mr-2">${h.keyword || 'Tanpa Keyword'}</span>
              <span class="text-[10px] font-medium bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 whitespace-nowrap">${h.total_results} produk</span>
            </div>
            <div class="text-[11px] text-gray-400 flex items-center justify-between">
              <span>${dateStr}</span>
              ${h.total_time ? `<span>${Math.round(h.total_time)} detik</span>` : ''}
            </div>
          </div>
        `
      }).join('')

      Array.from(historyContent.children).forEach(el => {
        el.addEventListener('click', () => {
          const filename = el.getAttribute('data-filename')
          if (filename) loadHistoryDetail(filename)
        })
      })

    } else {
      historyContent.innerHTML = `<div class="text-center text-gray-400 text-xs py-8">Belum ada riwayat.</div>`
    }
  } catch (err: any) {
    console.error("Load History Error:", err)
    historyContent.innerHTML = `<div class="text-center text-red-500 text-xs py-8 px-2 break-all overflow-hidden">Error: ${err.message || String(err)}</div>`
  }
}

async function loadHistoryDetail(filename: string) {
  closeSidebar()

  if (etaInterval) window.clearInterval(etaInterval)
  toastDiv.classList.add('translate-y-[200%]')

  btnLabel.textContent = 'Memuat riwayat...'
  submitBtn.disabled = true
  spinner.classList.remove('hidden')
  resultsDiv.innerHTML = ''
  resultsMeta.classList.add('hidden')

  try {
    const baseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000'
    const res = await fetch(`${baseUrl}/history/${filename}`)
    const json = await res.json() as ScrapeResponse

    if (json.status === 'success') {
      const keywordInput = document.getElementById('keyword') as HTMLInputElement
      keywordInput.value = json.keyword || ''

      if (json.data && json.data.length > 0) {
        ; (resultsDiv as HTMLElement & { _lastData?: Product[] })._lastData = json.data
        state.localQuery = ''
        state.localSortKey = null
        localSearchInput.value = ''

        triggerRender()
        resultsMeta.className = 'mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'

        let timeStr = ''
        if (json.total_time !== undefined) {
          timeStr = ` · diambil dalam ${formatTime(json.total_time)}`
        }
        if (json.scraped_at) {
          const dt = new Date(json.scraped_at)
          const formattedDate = dt.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }).replace(/\./g, ':')
          timeStr += ` pada ${formattedDate}`
        }
        resultsCount.textContent = `${json.total_results} produk · "${json.keyword}"${timeStr}`
      } else {
        resultsDiv.innerHTML = `<div class="text-center text-gray-400 text-xs py-8">Riwayat ini belum memiliki produk.</div>`
      }
    } else {
      throw new Error("Gagal memuat data histori")
    }
  } catch (err: any) {
    resultsDiv.innerHTML = `
      <div class="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>${err.message || String(err)}</span>
      </div>`
  } finally {
    spinner.classList.add('hidden')
    btnLabel.textContent = 'Scrape'
    submitBtn.disabled = false
  }
}

// ─── Form Submit ───────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const keyword = (document.getElementById('keyword') as HTMLInputElement).value.trim()
  const maxProducts = (document.getElementById('max_products') as HTMLInputElement).value

  resultsDiv.innerHTML = ''
  resultsMeta.classList.add('hidden')
  submitBtn.disabled = true
  spinner.classList.remove('hidden')
  btnLabel.textContent = 'Scraping...'

  try {
    const baseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000'
    const url = new URL(`${baseUrl}/scrape`)
    url.searchParams.set('keyword', keyword)
    if (maxProducts) url.searchParams.set('max_products', maxProducts)
    url.searchParams.set('index_only', 'true')
    url.searchParams.set('append_data', 'false')
    url.searchParams.set('sort_by', sortBySelect.getValue())
    if (sortBySelect.getValue() === 'price') {
      url.searchParams.set('sort_order', sortOrderSelect.getValue())
    }

    // Convert active columns to canonical keys to send to backend config
    const activeCanonicals = Array.from(state.visibleFields)
      .map(key => ALL_FIELDS.find(f => f.key === key)?.canonical)
      .filter(Boolean) as string[]

    if (activeCanonicals.length > 0) {
      url.searchParams.set('fields', activeCanonicals.join(','))
    }

    const eventSource = new EventSource(url.toString())

    function showError(msg: string) {
      resultsDiv.innerHTML = `
        <div class="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>${msg}</span>
        </div>`
    }

    function showProgressToast(msg: any) {
      toastDiv.classList.remove('translate-y-[200%]')
      toastStatus.textContent = msg.status
      toastFill.style.width = `${msg.percent}%`
      toastPct.textContent = `${msg.percent}%`

      if (msg.eta && !msg.eta.includes('Menghitung')) {
        const sec = parseInt(msg.eta.replace('s', '')) || 0
        if (sec > 0) startEtaCountdown(sec)
      } else {
        if (etaInterval) window.clearInterval(etaInterval)
        toastEta.textContent = 'Menghitung ETA...'
        toastEta.classList.remove('invisible')
      }
    }

    function hideProgressToast() {
      if (etaInterval) window.clearInterval(etaInterval)
      toastDiv.classList.add('translate-y-[200%]')
    }

    function finishLoading() {
      submitBtn.disabled = false
      spinner.classList.add('hidden')
      btnLabel.textContent = 'Scrape'
      hideProgressToast()
    }

    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        if (msg.type === 'progress') {
          showProgressToast(msg)
          btnLabel.textContent = 'Scraping...'
        } else if (msg.type === 'result') {
          eventSource.close()
          const json = msg.payload as ScrapeResponse

          if (json.data && json.data.length > 0) {
            ; (resultsDiv as HTMLElement & { _lastData?: Product[] })._lastData = json.data
            state.localQuery = ''
            state.localSortKey = null
            localSearchInput.value = ''

            triggerRender()
            resultsMeta.className = 'mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'

            let timeStr = ''
            if (json.total_time !== undefined) {
              timeStr = ` · diambil dalam ${formatTime(json.total_time)}`
            }
            if (json.scraped_at) {
              const dt = new Date(json.scraped_at)
              const formattedDate = dt.toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              }).replace(/\./g, ':')
              timeStr += ` pada ${formattedDate}`
            }
            resultsCount.textContent = `${json.total_results} produk · "${json.keyword}"${timeStr}`
          } else {
            resultsDiv.innerHTML = `
              <div class="flex flex-col items-center gap-2 py-16 text-gray-400">
                <svg class="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm">Tidak ada produk ditemukan.</p>
              </div>`
          }
          finishLoading()
        } else if (msg.type === 'error') {
          eventSource.close()
          showError(msg.message)
          finishLoading()
        }
      } catch (err) {
        console.error("Gagal mem-parsing data stream", err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      showError("Koneksi terputus (Server Error / Timeout). Coba periksa terminal server.")
      finishLoading()
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    resultsDiv.innerHTML = `
      <div class="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>${msg}</span>
      </div>`
    submitBtn.disabled = false
    spinner.classList.add('hidden')
    btnLabel.textContent = 'Scrape'
    toastDiv.classList.add('translate-y-[200%]')
  }
})

// ─── Render ───────────────────────────────────────────────────────────────────
function triggerRender() {
  const cached = (resultsDiv as HTMLElement & { _lastData?: Product[] })._lastData;
  if (!cached) return;

  let data = [...cached];

  // Apply Filter
  const q = state.localQuery.trim().toLowerCase();
  if (q) {
    data = data.filter(p => Object.values(p).join(' ').toLowerCase().includes(q));
  }

  // Apply Sorting
  if (state.localSortKey) {
    data.sort((a, b) => {
      let va: any = a[state.localSortKey as keyof Product] ?? '';
      let vb: any = b[state.localSortKey as keyof Product] ?? '';

      if (state.localSortKey === 'price') {
        va = parseFloat(String(va).replace(/[^0-9]/g, '')) || 0;
        vb = parseFloat(String(vb).replace(/[^0-9]/g, '')) || 0;
      } else if (state.localSortKey === 'rating') {
        va = parseFloat(String(va)) || 0;
        vb = parseFloat(String(vb)) || 0;
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }

      if (va < vb) return state.localSortDir === 'asc' ? -1 : 1;
      if (va > vb) return state.localSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Apply Pagination
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / state.pageSize);

  if (state.currentPage > totalPages) {
    state.currentPage = Math.max(1, totalPages);
  }

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const pagedData = data.slice(startIndex, startIndex + state.pageSize);

  if (state.viewMode === 'grid') {
    renderGrid(pagedData);
  } else {
    renderTable(pagedData, startIndex);
  }

  renderPaginationControls(totalItems, totalPages);
}

function renderPaginationControls(totalItems: number, totalPages: number) {
  if (totalItems === 0) {
    paginationControls.classList.add('hidden');
    return;
  }

  paginationControls.classList.remove('hidden');

  const startAt = (state.currentPage - 1) * state.pageSize + 1;
  const endAt = Math.min(state.currentPage * state.pageSize, totalItems);

  pageInfo.innerHTML = `<span class="hidden sm:inline">Menampilkan </span><strong class="text-gray-800">${startAt}-${endAt}</strong> dari <strong class="text-gray-800">${totalItems}</strong><span class="hidden sm:inline"> hasil</span>`;
  pageNumbers.innerHTML = `<span class="text-gray-900 font-bold">${state.currentPage}</span><span class="mx-1">/</span>${totalPages}`;

  const baseBtnClass = "flex-1 sm:flex-none px-4 py-1.5 rounded text-xs font-semibold transition-colors select-none text-center ";

  // Update prev styling
  if (state.currentPage === 1) {
    pagePrev.className = baseBtnClass + "text-gray-300 cursor-not-allowed bg-transparent";
    pagePrev.textContent = "Prev";
  } else {
    pagePrev.className = baseBtnClass + "text-gray-700 hover:bg-gray-50 active:bg-gray-100 cursor-pointer bg-transparent";
    pagePrev.textContent = "Prev";
  }

  // Update next styling
  if (state.currentPage >= totalPages) {
    pageNext.className = baseBtnClass + "text-gray-300 cursor-not-allowed bg-transparent";
    pageNext.textContent = "Next";
  } else {
    pageNext.className = baseBtnClass + "text-gray-700 hover:bg-gray-50 active:bg-gray-100 cursor-pointer bg-transparent";
    pageNext.textContent = "Next";
  }
}

function renderGrid(products: Product[]) {
  const showImg = state.visibleFields.has('img')
  const showName = state.visibleFields.has('name')
  const showPrice = state.visibleFields.has('price')
  const showRating = state.visibleFields.has('rating')
  const showLocation = state.visibleFields.has('location')
  const showShipping = state.visibleFields.has('shipping')

  resultsDiv.className = 'mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
  resultsDiv.innerHTML = products.map(p => {
    const price = p.price?.replace(/\n/g, ' ').trim() ?? ''
    const hasImg = p.img && p.img !== '<Image>' && !p.img.startsWith('data:image')

    return `
      <a href="${p.link ?? '#'}" target="_blank" rel="noopener noreferrer"
         class="group flex flex-col bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-orange-300 hover:shadow-md transition-all duration-200">
        ${showImg ? `
        <div class="aspect-square bg-gray-50 overflow-hidden">
          ${hasImg
          ? `<img src="${p.img}" alt="${p.name}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">`
          : `<div class="w-full h-full flex items-center justify-center">
                 <svg class="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                 </svg>
               </div>`
        }
        </div>` : ''}
        <div class="p-2.5 flex flex-col gap-0.5 flex-grow">
          ${showName ? `<p class="text-xs text-gray-700 font-medium line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">${p.name ?? '—'}</p>` : ''}
          ${showPrice ? `<p class="text-sm font-bold text-orange-500 mt-1">${price || '—'}</p>` : ''}
          ${(showRating || showLocation) ? `
          <div class="flex items-center justify-between mt-1">
            ${showRating ? `<span class="text-xs text-amber-500 font-medium">★ ${p.rating ?? '—'}</span>` : '<span></span>'}
            ${showLocation ? `<span class="text-xs text-gray-400 truncate max-w-[80px] text-right">${p.location ?? ''}</span>` : ''}
          </div>` : ''}
          ${showShipping && p.shipping ? `<span class="text-xs text-green-600 font-medium mt-0.5">${p.shipping}</span>` : ''}
        </div>
      </a>
    `
  }).join('')
}

function renderTable(products: Product[], startIndex: number) {
  // Build visible columns from ALL_FIELDS respecting order
  const cols = ALL_FIELDS.filter(f => state.visibleFields.has(f.key))

  resultsDiv.className = 'mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm'
  resultsDiv.innerHTML = `
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="bg-gray-50 border-b border-gray-200">
          <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
          ${cols.map(c => `
            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none group transition-colors" data-sort="${c.key}">
              <div class="flex items-center gap-1.5 text-nowrap">
                ${c.label}
                <span class="text-gray-300 group-hover:text-gray-400 ${state.localSortKey === c.key ? '!text-orange-500' : ''}">
                  ${state.localSortKey === c.key ? (state.localSortDir === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </div>
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${products.map((p, i) => `
          <tr class="border-b border-gray-100 hover:bg-orange-50/40 transition-colors bg-white">
            <td class="px-3 py-2.5 text-xs text-gray-400">${startIndex + i + 1}</td>
            ${cols.map(c => {
    if (c.key === 'name') return `<td class="px-3 py-2.5"><a href="${p.link ?? '#'}" target="_blank" class="font-medium text-gray-800 hover:text-orange-600 transition-colors line-clamp-1">${p.name ?? '—'}</a></td>`
    if (c.key === 'price') return `<td class="px-3 py-2.5 font-bold text-orange-500 whitespace-nowrap">${p.price?.replace(/\n/g, ' ').trim() ?? '—'}</td>`
    if (c.key === 'rating') return `<td class="px-3 py-2.5 text-amber-500 font-medium whitespace-nowrap">★ ${p.rating ?? '—'}</td>`
    if (c.key === 'img') return `<td class="px-3 py-2.5">${p.img && !p.img.startsWith('data:') && p.img !== '<Image>' ? `<img src="${p.img}" class="w-10 h-10 object-cover rounded-md border border-gray-100">` : '<span class="text-gray-300 text-xs">—</span>'}</td>`
    if (c.key === 'link') return `<td class="px-3 py-2.5"><a href="${p.link ?? '#'}" target="_blank" class="text-xs text-blue-500 hover:underline truncate max-w-[180px] block">${p.link ?? '—'}</a></td>`
    if (c.key === 'shipping') return `<td class="px-3 py-2.5 text-green-600 text-xs font-medium">${p.shipping || '—'}</td>`
    return `<td class="px-3 py-2.5 text-gray-600 whitespace-nowrap">${p[c.key] ?? '—'}</td>`
  }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}
