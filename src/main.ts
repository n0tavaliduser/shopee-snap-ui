import './style.css'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  link: string
  name: string
  price: string
  rating: string
  img: string
  shipping: string
  location: string
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
    // Update active style on items
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

  private toggle() {
    this.isOpen ? this.close() : this.open()
  }

  private open() {
    this.isOpen = true
    this.dropdown.classList.remove('hidden')
    this.renderTrigger()
  }

  private close() {
    this.isOpen = false
    this.dropdown.classList.add('hidden')
    this.renderTrigger()
  }

  getValue() {
    return this.selected.value
  }
}

// ─── App Markup ───────────────────────────────────────────────────────────────
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="max-w-3xl mx-auto px-4 py-12">

    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2.5 mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h1 class="text-xl font-bold text-gray-900 tracking-tight">Shopee Scraper</h1>
      </div>
      <p class="text-sm text-gray-400">Ambil data produk Shopee langsung dari browser.</p>
    </div>

    <!-- Search Bar -->
    <form id="scrape-form">
      <div class="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-400 transition-all">
        
        <!-- Keyword Input -->
        <div class="flex items-center flex-1 gap-2 px-2">
          <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            id="keyword"
            required
            placeholder="Cari produk... e.g. Laptop Gaming"
            class="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none py-1.5"
          />
        </div>

        <!-- Divider -->
        <div class="h-6 w-px bg-gray-200 flex-shrink-0"></div>

        <!-- Controls Row -->
        <div class="flex items-center gap-1.5 flex-shrink-0">
          
          <!-- Max Products -->
          <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-600">
            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h8"/>
            </svg>
            <input
              type="number"
              id="max_products"
              value="10"
              min="1"
              max="100"
              class="w-10 bg-transparent text-gray-700 text-sm text-center outline-none font-medium"
              title="Max produk"
            />
          </div>

          <!-- Sort By (custom select injected here) -->
          <div id="sort-select-container"></div>

          <!-- Sort Order (injected here, shown only for price) -->
          <div id="sort-order-container" class="hidden"></div>

          <!-- Submit -->
          <button
            type="submit"
            id="submit-btn"
            class="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold px-4 py-1.5 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            <svg id="loading-spinner" class="hidden animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span id="btn-label">Scrape</span>
          </button>
        </div>
      </div>
    </form>

    <!-- Status / Results info -->
    <div id="results-meta" class="hidden mt-5 flex items-center justify-between">
      <p id="results-count" class="text-xs text-gray-400"></p>
    </div>

    <!-- Results Grid -->
    <div id="results" class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"></div>

  </div>
`

// ─── State & refs ─────────────────────────────────────────────────────────────
const form = document.getElementById('scrape-form') as HTMLFormElement
const resultsDiv = document.getElementById('results') as HTMLDivElement
const resultsMeta = document.getElementById('results-meta') as HTMLDivElement
const resultsCount = document.getElementById('results-count') as HTMLParagraphElement
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement
const spinner = document.getElementById('loading-spinner') as HTMLElement
const btnLabel = document.getElementById('btn-label') as HTMLElement
const sortSelectContainer = document.getElementById('sort-select-container') as HTMLElement
const sortOrderContainer = document.getElementById('sort-order-container') as HTMLElement

// ─── Sort By Custom Select ─────────────────────────────────────────────────────

const sortBySelect = new CustomSelect(
  sortSelectContainer,
  [
    { value: 'sales', label: 'Terlaris' },
    { value: 'relevancy', label: 'Relevansi' },
    { value: 'ctime', label: 'Terbaru' },
    { value: 'price', label: 'Harga' },
  ],
  'sales',
  (val) => {
    if (val === 'price') {
      sortOrderContainer.classList.remove('hidden')
    } else {
      sortOrderContainer.classList.add('hidden')
    }
  }
)

// ─── Sort Order Custom Select (only for price) ─────────────────────────────────
const sortOrderSelect = new CustomSelect(
  sortOrderContainer,
  [
    { value: 'asc', label: '↑ Termurah' },
    { value: 'desc', label: '↓ Termahal' },
  ],
  'asc',
  (val) => { void val /* order tracked via sortOrderSelect.getValue() */ }
)

// ─── Form Submit ───────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const keyword = (document.getElementById('keyword') as HTMLInputElement).value.trim()
  const maxProducts = (document.getElementById('max_products') as HTMLInputElement).value

  // UI — loading state
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

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`)

    const json = (await res.json()) as ScrapeResponse

    if (json.data && json.data.length > 0) {
      renderResults(json.data)
      resultsMeta.classList.remove('hidden')
      resultsCount.textContent = `${json.total_results} produk ditemukan untuk "${json.keyword}"`
    } else {
      resultsDiv.innerHTML = `
        <div class="col-span-full flex flex-col items-center gap-2 py-16 text-gray-400">
          <svg class="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm font-medium">Tidak ada produk. Mungkin terblokir CAPTCHA?</p>
        </div>`
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    resultsDiv.innerHTML = `
      <div class="col-span-full flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
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

// ─── Render Results ────────────────────────────────────────────────────────────
function renderResults(products: Product[]) {
  resultsDiv.innerHTML = products.map(p => {
    const price = p.price.replace(/\n/g, ' ').trim()
    const hasImg = p.img && p.img !== '<Image>' && !p.img.startsWith('data:image')

    return `
      <a href="${p.link}" target="_blank" rel="noopener noreferrer"
         class="group flex flex-col bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-orange-300 hover:shadow-md transition-all duration-200">
        
        <!-- Image -->
        <div class="aspect-square bg-gray-50 overflow-hidden">
          ${hasImg
        ? `<img src="${p.img}" alt="${p.name}" loading="lazy"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">`
        : `<div class="w-full h-full flex items-center justify-center">
                 <svg class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                 </svg>
               </div>`
      }
        </div>

        <!-- Info -->
        <div class="p-2.5 flex flex-col gap-1 flex-grow">
          <p class="text-xs text-gray-700 font-medium line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
            ${p.name || 'Produk'}
          </p>
          <p class="text-sm font-bold text-orange-500 mt-auto">${price}</p>
          <div class="flex items-center justify-between mt-1">
            <span class="text-xs text-amber-500 font-medium">★ ${p.rating || '—'}</span>
            <span class="text-xs text-gray-400 truncate max-w-[70px] text-right">${p.location || ''}</span>
          </div>
        </div>
      </a>
    `
  }).join('')
}
