import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="max-w-4xl mx-auto p-4 md:p-8">
    <header class="text-center my-10">
      <div class="inline-block p-3 bg-orange-50 rounded-md mb-4 border border-orange-100 shadow-sm transition-transform hover:scale-105">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-3 font-sans tracking-tight">Shopee <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Scraper</span></h1>
      <p class="text-gray-500 text-lg md:text-xl font-light">Retrieve products data easily right from your browser.</p>
    </header>

    <div class="bg-white p-6 md:p-8 rounded-md shadow-sm border border-gray-200 flex flex-col gap-6 relative overflow-hidden">
      <!-- Decorator line on top -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>

      <form id="scrape-form" class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-bold text-gray-700 tracking-wide uppercase">Keyword</span>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input type="text" id="keyword" required placeholder="e.g. Compressor" class="w-full pl-10 pr-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-gray-400" />
          </div>
        </label>
        
        <label class="flex flex-col gap-2">
          <span class="text-sm font-bold text-gray-700 tracking-wide uppercase">Max Products</span>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <input type="number" id="max_products" value="2" min="1" class="w-full pl-10 pr-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-700" />
          </div>
        </label>

        <div class="col-span-1 md:col-span-2 flex items-center justify-end pt-2">
          <button type="submit" id="submit-btn" class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-3 transform hover:-translate-y-0.5">
            <svg id="loading-spinner" class="hidden animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Start Scraping</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Results Area -->
    <div id="results" class="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <!-- Cards will be appended here -->
    </div>
  </div>
`

// Interfaces
interface Product {
  link: string;
  name: string;
  price: string;
  rating: string;
  img: string;
  shipping: string;
  location: string;
}

interface ScrapeResponse {
  status: string;
  keyword: string;
  total_results: number;
  data: Product[];
}

const form = document.querySelector<HTMLFormElement>('#scrape-form')!;
const resultsDiv = document.querySelector<HTMLDivElement>('#results')!;
const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn')!;
const spinner = document.querySelector<SVGElement>('#loading-spinner')!;
const btnText = submitBtn.querySelector('span')!;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const keyword = (document.getElementById('keyword') as HTMLInputElement).value;
  const maxProducts = (document.getElementById('max_products') as HTMLInputElement).value;

  // UI state update
  resultsDiv.innerHTML = '';
  submitBtn.disabled = true;
  submitBtn.classList.add('opacity-75', 'cursor-not-allowed', 'scale-95');
  spinner.classList.remove('hidden');
  btnText.textContent = 'Chrome is Running...';

  try {
    // Call the FastAPI endpoint
    const url = new URL('http://localhost:8000/scrape');
    url.searchParams.append('keyword', keyword);
    if(maxProducts) url.searchParams.append('max_products', maxProducts);
    
    // Force index only for the UI preview
    url.searchParams.append('index_only', 'true');
    // Important: we append_data=false to just retrieve this fresh search
    url.searchParams.append('append_data', 'false');

    const res = await fetch(url.toString());
    
    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }

    const json = (await res.json()) as ScrapeResponse;
    
    if(json.data && json.data.length > 0) {
      renderResults(json.data);
    } else {
      resultsDiv.innerHTML = '<p class="text-center text-gray-500 w-full py-12 col-span-full font-medium">No products found. Are you blocked by captcha?</p>';
    }

  } catch (err: any) {
    resultsDiv.innerHTML = `<div class="col-span-full p-5 bg-red-50 text-red-600 rounded-md border border-red-200 flex items-center gap-3">
        <svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-medium">${err.message}</span>
      </div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-75', 'cursor-not-allowed', 'scale-95');
    spinner.classList.add('hidden');
    btnText.textContent = 'Start Scraping';
  }
});

function renderResults(products: Product[]) {
  const html = products.map(p => {
    // Basic price formatting fallback
    let priceClean = p.price.replace('\n', ' ');
    
    return `
      <a href="${p.link}" target="_blank" class="flex flex-col bg-white rounded-md border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group transform hover:-translate-y-1">
        <div class="h-56 bg-gray-100 overflow-hidden relative">
          ${p.img && p.img !== '<Image>' && !p.img.includes('data:image') 
            ? `<img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">` 
            : `<div class="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                 <svg class="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                 <span class="text-sm font-medium">No Image</span>
               </div>`}
        </div>
        <div class="p-4 flex flex-col flex-grow gap-2">
          <h2 class="font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">${p.name || 'Unnamed Product'}</h2>
          <p class="text-orange-500 text-lg font-extrabold mt-1">${priceClean}</p>
          
          <div class="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div class="flex items-center gap-1 font-medium text-gray-700">
               <span class="text-amber-400 text-sm">★</span> ${p.rating || '0'}
            </div>
            <span class="truncate max-w-[100px] text-right" title="${p.location}">${p.location}</span>
          </div>
          
          ${p.shipping ? `<span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 text-xs py-1 font-semibold text-green-700 rounded-md border border-green-100 shadow-sm">${p.shipping}</span>` : ''}
        </div>
      </a>
    `;
  }).join('');
  
  resultsDiv.innerHTML = html;
}
