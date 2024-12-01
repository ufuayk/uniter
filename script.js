function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-bs-theme', newTheme);
    themeIcon.className = newTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    
    localStorage.setItem('theme', newTheme);
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    document.getElementById('themeIcon').className = 
        savedTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
});

let universities = {};

fetch('data/data.json')
    .then(response => response.json())
    .then(data => {
        universities = data;
        populateCities();
        filterUniversities();
    });

function populateCities() {
    const cities = new Set();
    Object.values(universities).forEach(uni => {
        cities.add(uni.sehir);
    });
    
    const sehirSelect = document.getElementById('sehir');
    Array.from(cities).sort().forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        sehirSelect.appendChild(option);
    });
}

function compareRanking(userRanking, programRanking) {
    if (programRanking === "Dolmadı") return false;
    return parseInt(userRanking) <= parseInt(programRanking.replace(/\./g, ''));
}

/* Kısaltma */

function getInitials(universityName) {
    return universityName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2);
}

/**/

let currentPage = 1;
const resultsPerPage = 12;

function filterUniversities() {
    const puanTuru = document.getElementById('puanTuru').value;
    const selectedCity = document.getElementById('sehir').value;
    const selectedType = document.getElementById('uniTur').value;
    const userRanking = document.getElementById('siralama').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    const filteredResults = [];

    Object.entries(universities).forEach(([id, uni]) => {
        if (selectedCity && uni.sehir !== selectedCity) return;
        if (selectedType && uni.uniTur !== selectedType) return;

        const programs = uni[puanTuru];
        if (!programs) return;

        programs.forEach(program => {
            if ((!userRanking || compareRanking(userRanking, program.siralama)) &&
                (!searchQuery || program.bolumAdi.toLowerCase().includes(searchQuery))) {
                filteredResults.push({
                    university: uni,
                    program: program
                });
            }
        });
    });

    filteredResults.sort((a, b) => {
        const rankA = a.program.siralama === "Dolmadı" ? Infinity : parseInt(a.program.siralama.replace(/\./g, ''));
        const rankB = b.program.siralama === "Dolmadı" ? Infinity : parseInt(b.program.siralama.replace(/\./g, ''));
        return rankA - rankB;
    });

    displayResults(filteredResults);
    updatePagination(filteredResults.length);
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = results.slice(startIndex, endIndex);

    paginatedResults.forEach(result => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        card.innerHTML = `
            <div class="card university-card h-100">
                <div class="card-body">
                    <div class="card-title-wrapper">
                        <div class="university-avatar">
                            ${getInitials(result.university.uniAdi)}
                        </div>
                        <h5 class="card-title">${result.university.uniAdi}</h5>
                    </div>
                    <p class="card-text">${result.program.bolumAdi}</p>
                    <div class="mb-2">
                        <span class="badge bg-primary">${result.program.siralama === "Dolmadı" ? "Dolmadı" : result.program.siralama + ". (son yerleşen)"}</span>
                        <span class="badge bg-success">${result.program.puan === "Dolmadı" ? "Dolmadı" : result.program.puan + " puan"}</span>
                        <span class="badge bg-info">${result.program.burs}</span>
                    </div>
                    <small class="text-muted"><i class="fa-solid fa-city"></i> Bulunduğu İl: ${result.university.sehir}</small>
                    <h5></h5>            
                    <small class="text-muted"><i class="fa-solid fa-building-columns"></i> Üniversite Türü: ${result.university.uniTur}</small>
                    ${result.program.bolumKodu && result.program.bolumKodu !== "* Eski Kod" ? `
                        <div class="mt-3">
                            <a href="https://yokatlas.yok.gov.tr/lisans.php?y=${result.program.bolumKodu}" 
                               target="_blank" 
                               class="btn btn-outline-primary btn-sm w-100">
                                <i class="fa-solid fa-arrow-up-right-from-square me-1"></i> Yükseköğretim Program Atlasında İncele
                            </a>
                    </div>
                    ` : ''}
                    ${result.program.bolumKodu && result.program.bolumKodu !== "* Eski Kod" ? `
                        <div class="mt-3">
                            <a href="https://yokatlas.yok.gov.tr/externalAppParameter.php?y=${result.program.bolumKodu}" 
                               target="_blank" 
                               class="btn btn-outline-primary btn-sm w-100">
                                <i class="fa-solid fa-users me-1"></i>Bölümün Akademik Kadrosunu İncele
                            </a>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        resultsDiv.appendChild(card);
    });
}

function updatePagination(totalResults) {
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';

    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    if (totalPages <= 1) {
        return;
    }

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Önceki">
        <span aria-hidden="true">&laquo;</span>
    </a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            filterUniversities();
            window.scrollTo(0, 0);
        }
    });
    paginationElement.appendChild(prevLi);

    const addPageNumber = (pageNum) => {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === pageNum ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${pageNum}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = pageNum;
            filterUniversities();
            window.scrollTo(0, 0);
        });
        paginationElement.appendChild(li);
    };

    const addEllipsis = () => {
        const li = document.createElement('li');
        li.className = 'page-item disabled';
        li.innerHTML = '<a class="page-link" href="#">...</a>';
        paginationElement.appendChild(li);
    };

    addPageNumber(1);

    let leftBound = Math.max(2, currentPage - 2);
    let rightBound = Math.min(totalPages - 1, currentPage + 2);

    if (leftBound > 2) {
        addEllipsis();
    }

    for (let i = leftBound; i <= rightBound; i++) {
        addPageNumber(i);
    }

    if (rightBound < totalPages - 1) {
        addEllipsis();
    }

    if (totalPages > 1) {
        addPageNumber(totalPages);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Sonraki">
        <span aria-hidden="true">&raquo;</span>
    </a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            filterUniversities();
            window.scrollTo(0, 0);
        }
    });
    paginationElement.appendChild(nextLi);
}

document.getElementById('searchInput').addEventListener('input', filterUniversities);
document.getElementById('siralama').addEventListener('input', filterUniversities);
document.getElementById('puanTuru').addEventListener('change', filterUniversities);
document.getElementById('sehir').addEventListener('change', filterUniversities);
document.getElementById('uniTur').addEventListener('change', filterUniversities);