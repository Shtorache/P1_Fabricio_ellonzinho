const launchList = document.getElementById('launch-list');
const favoritesList = document.getElementById('favorites-list');
const yearFilter = document.getElementById('year-filter');
const filterButton = document.getElementById('filter-button');
const showFavoritesCheckbox = document.getElementById('show-favorites');
let launches = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentIndex = 0;  
const HowMuch = 10; 

async function fetchLaunches() {
    try {
        const response = await fetch('https://api.spacexdata.com/v4/launches');
        const data = await response.json();
        launches = data; 
        populateYearFilter(); 
        displayLaunches(launches.slice(0, HowMuch)); 
        displayLaunchCounts(); 
        currentIndex = HowMuch; 
    } catch (error) {
        console.error('Erro ao buscar lançamentos:', error);
    }
}

function populateYearFilter() {
    const years = [...new Set(launches.map(launch => new Date(launch.date_utc).getFullYear()))];
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

function displayLaunches(launchesToDisplay) {
    launchesToDisplay.forEach(launch => {
        const li = document.createElement('li'); 
        li.className = 'item';
        li.innerHTML = `
            <img src="${launch.links.patch.small || 'https://via.placeholder.com/50'}" alt="${launch.name}">
            <div class="details">
                ${launch.name} (${new Date(launch.date_utc).toLocaleDateString()}) 
                <input type="checkbox" class="favorite-checkbox" ${favorites.includes(launch.id) ? 'checked' : ''} />
            </div>
        `;

        const checkbox = li.querySelector('.favorite-checkbox');

        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();   
            toggleFavorite(launch.id, e.target.checked);
        });

        li.addEventListener('click', () => showLaunchDetails(launch));

        launchList.appendChild(li); 
    });
}

function loadMoreLaunches() {
    const remainingLaunches = launches.slice(currentIndex, currentIndex + HowMuch);
    
    if (remainingLaunches.length > 0) {
        displayLaunches(remainingLaunches);
        currentIndex += HowMuch;
    } else {
        currentIndex = 0;
        displayLaunches(launches.slice(currentIndex, currentIndex + HowMuch));
        currentIndex += HowMuch;
    }
}

function handleScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 100;
    if (scrollPosition >= threshold) {
        loadMoreLaunches();
    }
}

function displayLaunchCounts(year) {
    const launchCounts = countLaunchesByYear(year);
    const countsList = document.getElementById('counts-list'); 

    countsList.innerHTML = ''; 

    if (year) {
        const li = document.createElement('li'); 
        li.textContent = ` ${year}: ${launchCounts}`;
        countsList.appendChild(li);
    }
}

function countLaunchesByYear(selectedYear) {
    return launches.filter(launch => {
        const launchYear = new Date(launch.date_utc).getFullYear();
        return launchYear === parseInt(selectedYear);
    }).length;
}

filterButton.addEventListener('click', () => {
    filterLaunchesByYear();
});

function filterLaunchesByYear() {
    const selectedYear = yearFilter.value;

    const filteredLaunches = launches.filter(launch => {
        const launchYear = new Date(launch.date_utc).getFullYear();
        return selectedYear ? launchYear === parseInt(selectedYear) : true;
    });

    if (showFavoritesCheckbox.checked) {
        const favoriteFilteredLaunches = filteredLaunches.filter(launch => favorites.includes(launch.id));
        launchList.innerHTML = ''; 
        currentIndex = 0;
        displayLaunches(favoriteFilteredLaunches.slice(0, HowMuch));
        currentIndex = HowMuch;
    } else {
        launchList.innerHTML = ''; 
        currentIndex = 0;
        displayLaunches(filteredLaunches.slice(0, HowMuch));
        currentIndex = HowMuch;
    }

    displayLaunchCounts(selectedYear); 
}

function toggleFavorite(launchId, isFavorite) {
    if (isFavorite) {
        if (!favorites.includes(launchId)) {
            favorites.push(launchId);
        }
    } else {
        favorites = favorites.filter(id => id !== launchId);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
}

function showLaunchDetails(launch) {
    const modal = document.getElementById('launch-details-modal');
    const details = document.getElementById('launch-details');
    details.innerHTML = `
        Nome: ${launch.name}<br>
        Data: ${new Date(launch.date_utc).toLocaleDateString()}<br>
        Detalhes: ${launch.details || 'Nenhum detalhe disponível.'}
    `;
    modal.style.display = 'block';
}

function closeDetails() {
    const modal = document.getElementById('launch-details-modal');
    modal.style.display = 'none';
}

function displayFavorites() {
    favoritesList.innerHTML = ''; 
    favorites.forEach(id => {
        const launch = launches.find(l => l.id === id);
        if (launch) {
            const li = document.createElement('li'); 
            li.textContent = `${launch.name} (${new Date(launch.date_utc).toLocaleDateString()})`;
            favoritesList.appendChild(li);
        }
    });
}

fetchLaunches();
window.addEventListener('scroll', handleScroll);
