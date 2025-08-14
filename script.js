// Global variables
const apiKey = "dc0b12c9"; // Your OMDb API Key
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const moviesGrid = document.getElementById("moviesGrid");
const favoritesGrid = document.getElementById("favoritesGrid");
const resultsCount = document.getElementById("resultsCount");
const favoritesCount = document.getElementById("favoritesCount");
const loadingSpinner = document.getElementById("loadingSpinner");
const movieModal = document.getElementById("movieModal");
const modalContent = document.getElementById("modalContent");
const closeModal = document.querySelector(".close-modal");
const noResults = document.getElementById("noResults");
const emptyFavorites = document.getElementById("emptyFavorites");
const clearFavoritesBtn = document.getElementById("clearFavorites");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let currentSearchResults = [];

// Initialize the app
function init() {
    displayFavorites();
    updateFavoritesCount();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") handleSearch();
    });
    
    closeModal.addEventListener("click", closeMovieModal);
    movieModal.addEventListener("click", (e) => {
        if (e.target === movieModal) closeMovieModal();
    });
    
    clearFavoritesBtn.addEventListener("click", clearAllFavorites);
    
    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMovieModal();
    });
}

// Handle search
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        showNotification("Please enter a search term", "error");
        return;
    }
    
    showLoading(true);
    try {
        await fetchMovies(query);
    } catch (error) {
        showNotification("Error searching for movies", "error");
        console.error("Search error:", error);
    } finally {
        showLoading(false);
    }
}

// Fetch movies from API
async function fetchMovies(query) {
    const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.Response === "True" && data.Search) {
        currentSearchResults = data.Search;
        displaySearchResults(currentSearchResults);
        updateResultsCount(currentSearchResults.length);
        noResults.style.display = "none";
    } else {
        currentSearchResults = [];
        moviesGrid.innerHTML = "";
        noResults.style.display = "block";
        updateResultsCount(0);
        showNotification("No movies found for your search", "info");
    }
}

// Display search results
function displaySearchResults(movies) {
    moviesGrid.innerHTML = "";
    
    movies.forEach(movie => {
        const card = createMovieCard(movie, "search");
        moviesGrid.appendChild(card);
    });
}

// Create movie card
function createMovieCard(movie, type = "search") {
    const card = document.createElement("div");
    card.classList.add("movie-card");
    
    const isFavorite = favorites.some(fav => fav.id === movie.imdbID);
    
    card.innerHTML = `
        <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450/667eea/ffffff?text=No+Image"}" 
             alt="${movie.Title}" 
             onerror="this.src='https://via.placeholder.com/300x450/667eea/ffffff?text=No+Image'">
        <div class="movie-info">
            <h3 class="movie-title">${movie.Title}</h3>
            <p class="movie-year">${movie.Year}</p>
            <div class="movie-actions">
                ${type === "search" ? `
                    <button class="btn btn-secondary" onclick="showMovieDetails('${movie.imdbID}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="btn ${isFavorite ? 'btn-danger' : 'btn-primary'}" 
                            onclick="${isFavorite ? 'removeFromFavorites' : 'addToFavorites'}('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}', '${movie.Poster}')">
                        <i class="fas fa-${isFavorite ? 'heart-broken' : 'heart'}"></i>
                        ${isFavorite ? 'Remove' : 'Add'}
                    </button>
                ` : `
                    <button class="btn btn-secondary" onclick="showMovieDetails('${movie.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="btn btn-danger" onclick="removeFromFavorites('${movie.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                `}
            </div>
        </div>
    `;
    
    return card;
}

// Show movie details modal
async function showMovieDetails(imdbId) {
    showLoading(true);
    try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}&plot=full`);
        const movie = await response.json();
        
        if (movie.Response === "True") {
            displayMovieModal(movie);
        } else {
            showNotification("Error loading movie details", "error");
        }
    } catch (error) {
        showNotification("Error loading movie details", "error");
        console.error("Movie details error:", error);
    } finally {
        showLoading(false);
    }
}

// Display movie modal
function displayMovieModal(movie) {
    const rating = movie.imdbRating !== "N/A" ? movie.imdbRating : "N/A";
    const runtime = movie.Runtime !== "N/A" ? movie.Runtime : "Unknown";
    const genre = movie.Genre !== "N/A" ? movie.Genre : "Unknown";
    const plot = movie.Plot !== "N/A" ? movie.Plot : "No plot available";
    
    modalContent.innerHTML = `
        <div class="movie-modal-content">
            <div class="movie-modal-header">
                <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450/667eea/ffffff?text=No+Image"}" 
                     alt="${movie.Title}" 
                     onerror="this.src='https://via.placeholder.com/300x450/667eea/ffffff?text=No+Image'">
                <div class="movie-modal-info">
                    <h2>${movie.Title}</h2>
                    <div class="movie-meta">
                        <span><i class="fas fa-calendar"></i> ${movie.Year}</span>
                        <span><i class="fas fa-clock"></i> ${runtime}</span>
                        <span><i class="fas fa-star"></i> ${rating}/10</span>
                    </div>
                    <p class="movie-genre"><i class="fas fa-tags"></i> ${genre}</p>
                    <p class="movie-director"><i class="fas fa-user"></i> ${movie.Director !== "N/A" ? movie.Director : "Unknown"}</p>
                    <p class="movie-actors"><i class="fas fa-users"></i> ${movie.Actors !== "N/A" ? movie.Actors : "Unknown"}</p>
                </div>
            </div>
            <div class="movie-modal-body">
                <h3>Plot</h3>
                <p>${plot}</p>
                ${movie.Awards !== "N/A" ? `
                    <h3>Awards</h3>
                    <p>${movie.Awards}</p>
                ` : ''}
            </div>
        </div>
    `;
    
    movieModal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

// Close movie modal
function closeMovieModal() {
    movieModal.style.display = "none";
    document.body.style.overflow = "auto";
}

// Add to favorites
function addToFavorites(id, title, poster) {
    if (!favorites.find(movie => movie.id === id)) {
        const movie = { id, title, poster };
        favorites.push(movie);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        displayFavorites();
        updateFavoritesCount();
        showNotification(`${title} added to favorites!`, "success");
        
        // Update the search results to reflect the change
        if (currentSearchResults.length > 0) {
            displaySearchResults(currentSearchResults);
        }
    } else {
        showNotification("Movie is already in favorites", "info");
    }
}

// Remove from favorites
function removeFromFavorites(id) {
    const movie = favorites.find(m => m.id === id);
    favorites = favorites.filter(movie => movie.id !== id);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayFavorites();
    updateFavoritesCount();
    
    if (movie) {
        showNotification(`${movie.title} removed from favorites`, "success");
    }
    
    // Update the search results to reflect the change
    if (currentSearchResults.length > 0) {
        displaySearchResults(currentSearchResults);
    }
}

// Clear all favorites
function clearAllFavorites() {
    if (favorites.length === 0) {
        showNotification("No favorites to clear", "info");
        return;
    }
    
    if (confirm("Are you sure you want to clear all favorites?")) {
        favorites = [];
        localStorage.setItem("favorites", JSON.stringify(favorites));
        displayFavorites();
        updateFavoritesCount();
        showNotification("All favorites cleared", "success");
        
        // Update the search results to reflect the change
        if (currentSearchResults.length > 0) {
            displaySearchResults(currentSearchResults);
        }
    }
}

// Display favorites
function displayFavorites() {
    favoritesGrid.innerHTML = "";
    
    if (favorites.length === 0) {
        emptyFavorites.style.display = "block";
    } else {
        emptyFavorites.style.display = "none";
        favorites.forEach(movie => {
            const card = createMovieCard(movie, "favorites");
            favoritesGrid.appendChild(card);
        });
    }
}

// Update favorites count
function updateFavoritesCount() {
    favoritesCount.textContent = favorites.length;
}

// Update results count
function updateResultsCount(count) {
    resultsCount.textContent = `${count} result${count !== 1 ? 's' : ''}`;
}

// Show/hide loading spinner
function showLoading(show) {
    loadingSpinner.style.display = show ? "flex" : "none";
}

// Show notification
function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = "translateX(0)";
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = "translateX(400px)";
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
