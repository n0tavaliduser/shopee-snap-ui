import './style.css'

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
  data: Product[]
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
  { key: 'name',     canonical: 'product_name', label: 'Nama Produk' },
  { key: 'price',    canonical: 'price',        label: 'Harga' },
  { key: 'rating',   canonical: 'rating',       label: 'Rating' },
  { key: 'location', canonical: 'location',     label: 'Lokasi' },
  { key: 'shipping', canonical: 'shipping',     label: 'Ongkir' },
  { key: 'img',      canonical: 'image_url',    label: 'Gambar' },
  { key: 'link',     canonical: 'url',          label: 'URL' },
]

// ─── App State ────────────────────────────────────────────────────────────────
type ViewMode = 'grid' | 'table'

const state = {
  viewMode: 'table' as ViewMode,
  // default visible fields
  visibleFields: new Set<keyof Product>(['name', 'price', 'link']),
  configOpen: false,
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
    this.wrapper.className = 'relative'

    this.trigger = document.createElement('button') as HTMLButtonElement
    this.trigger.type = 'button'
    this.trigger.className = [
      'flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200',
      'bg-white text-sm text-gray-700 font-medium cursor-pointer',
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
        'w-full text-left px-3 py-2 text-sm transition-colors',
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
      <span>${this.selected.label}</span>
      <svg class="w-3.5 h-3.5 text-gray-400 transition-transform ${this.isOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        'w-full text-left px-3 py-2 text-sm transition-colors',
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
  <div class="max-w-4xl mx-auto px-4 py-10">

    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h1 class="text-lg font-bold text-gray-900 tracking-tight">Shopee Scraper</h1>
      </div>
      <p class="text-xs text-gray-400 ml-7">Ambil data produk Shopee langsung dari browser.</p>
    </div>

    <!-- Search Bar -->
    <form id="scrape-form">
      <div class="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-400 transition-all">

        <!-- Keyword -->
        <div class="flex items-center flex-1 gap-2 px-2">
          <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" id="keyword" required placeholder="Cari produk..."
            class="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none py-1.5"/>
        </div>

        <div class="h-5 w-px bg-gray-200 flex-shrink-0"></div>

        <!-- Controls -->
        <div class="flex items-center gap-1.5 flex-shrink-0">

          <!-- Max Products -->
          <div class="flex items-center gap-1 px-2 py-1.5 rounded-md border border-gray-200 bg-gray-50">
            <span class="text-xs text-gray-400 select-none">maks</span>
            <input type="number" id="max_products" value="10" min="1" max="100"
              class="w-8 bg-transparent text-gray-700 text-sm text-center outline-none font-medium" title="Max produk"/>
          </div>

          <!-- Sort By -->
          <div id="sort-select-container"></div>
          <div id="sort-order-container" class="hidden"></div>

          <!-- Config toggle -->
          <button type="button" id="config-toggle"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-all font-medium">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
            <span>Config</span>
          </button>

          <!-- Submit -->
          <button type="submit" id="submit-btn"
            class="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold px-4 py-1.5 rounded-md transition-all">
            <svg id="loading-spinner" class="hidden animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
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
    </div>

    <!-- Results meta -->
    <div id="results-meta" class="hidden mt-5">
      <p id="results-count" class="text-xs text-gray-400"></p>
    </div>

    <!-- Results area -->
    <div id="results" class="mt-3"></div>

  </div>
`

// ─── Refs ─────────────────────────────────────────────────────────────────────
const form            = document.getElementById('scrape-form')    as HTMLFormElement
const resultsDiv      = document.getElementById('results')        as HTMLDivElement
const resultsMeta     = document.getElementById('results-meta')   as HTMLDivElement
const resultsCount    = document.getElementById('results-count')  as HTMLParagraphElement
const submitBtn       = document.getElementById('submit-btn')     as HTMLButtonElement
const spinner         = document.getElementById('loading-spinner')as HTMLElement
const btnLabel        = document.getElementById('btn-label')      as HTMLElement
const sortSelectEl    = document.getElementById('sort-select-container') as HTMLElement
const sortOrderEl     = document.getElementById('sort-order-container')  as HTMLElement
const configToggleBtn = document.getElementById('config-toggle')  as HTMLButtonElement
const configPanel     = document.getElementById('config-panel')   as HTMLDivElement
const fieldToggles    = document.getElementById('field-toggles')  as HTMLDivElement
const viewGridBtn     = document.getElementById('view-grid')      as HTMLButtonElement
const viewTableBtn    = document.getElementById('view-table')     as HTMLButtonElement

// ─── Sort Selects ─────────────────────────────────────────────────────────────
const sortBySelect = new CustomSelect(sortSelectEl, [
  { value: 'sales',     label: 'Terlaris' },
  { value: 'relevancy', label: 'Relevansi' },
  { value: 'ctime',     label: 'Terbaru' },
  { value: 'price',     label: 'Harga' },
], 'sales', (val) => {
  val === 'price'
    ? sortOrderEl.classList.remove('hidden')
    : sortOrderEl.classList.add('hidden')
})

const sortOrderSelect = new CustomSelect(sortOrderEl, [
  { value: 'asc',  label: '↑ Termurah' },
  { value: 'desc', label: '↓ Termahal' },
], 'asc', () => {})

// ─── Config Panel ─────────────────────────────────────────────────────────────

// Toggle panel
configToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  state.configOpen = !state.configOpen
  configPanel.classList.toggle('hidden', !state.configOpen)
  configToggleBtn.classList.toggle('border-orange-400', state.configOpen)
  configToggleBtn.classList.toggle('text-orange-600', state.configOpen)
})
document.addEventListener('click', (e) => {
  if (!configPanel.contains(e.target as Node) && e.target !== configToggleBtn) {
    state.configOpen = false
    configPanel.classList.add('hidden')
    configToggleBtn.classList.remove('border-orange-400', 'text-orange-600')
  }
})

// View mode buttons
function setViewMode(mode: ViewMode) {
  state.viewMode = mode
  const isGrid = mode === 'grid'
  viewGridBtn.className = `view-btn flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${isGrid ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-600'}`
  viewTableBtn.className = `view-btn flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${!isGrid ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-600'}`
  // Re-render if data exists
  const cached = (resultsDiv as HTMLElement & { _lastData?: Product[] })._lastData
  if (cached) renderResults(cached)
}

viewGridBtn.addEventListener('click', () => setViewMode('grid'))
viewTableBtn.addEventListener('click', () => setViewMode('table'))

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
      const cached = (resultsDiv as HTMLElement & { _lastData?: Product[] })._lastData
      if (cached) renderResults(cached)
    })
    fieldToggles.appendChild(chip)
  })
}
renderFieldToggles()

// ─── Form Submit ───────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const keyword    = (document.getElementById('keyword')      as HTMLInputElement).value.trim()
  const maxProducts= (document.getElementById('max_products') as HTMLInputElement).value

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

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`)

    const json = (await res.json()) as ScrapeResponse

    if (json.data && json.data.length > 0) {
      ;(resultsDiv as HTMLElement & { _lastData?: Product[] })._lastData = json.data
      renderResults(json.data)
      resultsMeta.classList.remove('hidden')
      resultsCount.textContent = `${json.total_results} produk · "${json.keyword}"`
    } else {
      resultsDiv.innerHTML = `
        <div class="flex flex-col items-center gap-2 py-16 text-gray-400">
          <svg class="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm">Tidak ada produk. Mungkin terblokir CAPTCHA?</p>
        </div>`
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
  } finally {
    submitBtn.disabled = false
    spinner.classList.add('hidden')
    btnLabel.textContent = 'Scrape'
  }
})

// ─── Render ───────────────────────────────────────────────────────────────────
function renderResults(products: Product[]) {
  if (state.viewMode === 'grid') {
    renderGrid(products)
  } else {
    renderTable(products)
  }
}

function renderGrid(products: Product[]) {
  const showImg  = state.visibleFields.has('img')
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
          ${showName    ? `<p class="text-xs text-gray-700 font-medium line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">${p.name ?? '—'}</p>` : ''}
          ${showPrice   ? `<p class="text-sm font-bold text-orange-500 mt-1">${price || '—'}</p>` : ''}
          ${(showRating || showLocation) ? `
          <div class="flex items-center justify-between mt-1">
            ${showRating   ? `<span class="text-xs text-amber-500 font-medium">★ ${p.rating ?? '—'}</span>` : '<span></span>'}
            ${showLocation ? `<span class="text-xs text-gray-400 truncate max-w-[80px] text-right">${p.location ?? ''}</span>` : ''}
          </div>` : ''}
          ${showShipping && p.shipping ? `<span class="text-xs text-green-600 font-medium mt-0.5">${p.shipping}</span>` : ''}
        </div>
      </a>
    `
  }).join('')
}

function renderTable(products: Product[]) {
  // Build visible columns from ALL_FIELDS respecting order
  const cols = ALL_FIELDS.filter(f => state.visibleFields.has(f.key))

  resultsDiv.className = 'mt-3 overflow-x-auto rounded-lg border border-gray-200'
  resultsDiv.innerHTML = `
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="bg-gray-50 border-b border-gray-200">
          <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
          ${cols.map(c => `<th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">${c.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${products.map((p, i) => `
          <tr class="border-b border-gray-100 hover:bg-orange-50/40 transition-colors">
            <td class="px-3 py-2.5 text-xs text-gray-400">${i + 1}</td>
            ${cols.map(c => {
              if (c.key === 'name')  return `<td class="px-3 py-2.5"><a href="${p.link ?? '#'}" target="_blank" class="font-medium text-gray-800 hover:text-orange-600 transition-colors line-clamp-1">${p.name ?? '—'}</a></td>`
              if (c.key === 'price') return `<td class="px-3 py-2.5 font-bold text-orange-500 whitespace-nowrap">${p.price?.replace(/\n/g,' ').trim() ?? '—'}</td>`
              if (c.key === 'rating') return `<td class="px-3 py-2.5 text-amber-500 font-medium whitespace-nowrap">★ ${p.rating ?? '—'}</td>`
              if (c.key === 'img')   return `<td class="px-3 py-2.5">${p.img && !p.img.startsWith('data:') && p.img !== '<Image>' ? `<img src="${p.img}" class="w-10 h-10 object-cover rounded-md border border-gray-100">` : '<span class="text-gray-300 text-xs">—</span>'}</td>`
              if (c.key === 'link')  return `<td class="px-3 py-2.5"><a href="${p.link ?? '#'}" target="_blank" class="text-xs text-blue-500 hover:underline truncate max-w-[180px] block">${p.link ?? '—'}</a></td>`
              if (c.key === 'shipping') return `<td class="px-3 py-2.5 text-green-600 text-xs font-medium">${p.shipping || '—'}</td>`
              return `<td class="px-3 py-2.5 text-gray-600 whitespace-nowrap">${p[c.key] ?? '—'}</td>`
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}
