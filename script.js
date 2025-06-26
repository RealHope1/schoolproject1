// script.js

// Declare global variables for map, markers, popups, and route layer
let map;
let markers = []; // Stores Leaflet markers for campus locations
let popups = []; // Stores Leaflet popups (equivalent to InfoWindows)
let currentRouteLayer; // To store the drawn route polyline for clearing
let userLocationMarker; // Stores the marker for the user's current location

// Sample campus data with approximate latitude and longitude coordinates (Leaflet uses [lat, lng] arrays)
// IMPORTANT: Replace these with actual coordinates relevant to your campus!
const campusLocations = {
    "Library": { coords: [5.59634590406082, -0.22314718275175768], description: "GCTU Library - The main university library. A central hub for academic resources." },
    "Cafeteria": { coords: [5.595289588556981, -0.22367428106768558], description: "GCTU BUSH CANTEEN - Main dining facility, offering various cuisines." },
    "Admin Building": { coords: [5.596872870663835, -0.22324127897132412], description: "ADMISSION BLOCK - University Hall - Central administration building for student services." },
    "Lecture Hall C": { coords: [5.595505454837914, -0.22384014559250479], description: "GCTU GREAT HALL & C BLOCK - Used for major courses and events." },
    "Sports Complex": { coords: [5.595053646080984, -0.2235511581914859], description: "ZONGO BLOGGER- Athletics Complex - Includes various sports, including soccer, and basketball, volleyball, and handball.." },
    "Student Union": { coords: [5.596155635453689, -0.22295836005308878], description: "GCTU Union - Vibrant hub for student activities and relaxation." },
    "Engineering Building": { coords: [5.59582302711884, -0.22407434329939152], description: "FoCIS DEPT - Computer Science and Software Engineering department." },
    "Faculty of Engineering": { coords: [5.596015490596719, -0.2225499937292857], description: "Faculty of Engineering - Creative space for all engineering skills including Telecommunications Engineering, Computer Engineering, Electrical and Electronics Engineering, and Mathematics." }
};

// Define the central point of the campus. This is where the map will initially focus.
const CAMPUS_CENTER = [5.596359392848146, -0.22317617191216468];
const INITIAL_ZOOM = 16; // Adjust zoom level based on your campus size

/**
 * Initializes the Leaflet Map and sets up initial layers and markers.
 * This function is called when the DOM is ready.
 */
function initMap() {
    // Create the map instance and set its initial view.
    // Ensure the 'map' div exists and has a defined height in CSS.
    map = L.map('map').setView(CAMPUS_CENTER, INITIAL_ZOOM);

    // Add a tile layer (OpenStreetMap is a common free choice).
    // This forms the visual base of your map.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add markers for each predefined campus location.
    addCampusMarkers();

    // Set up all interactive event listeners.
    setupEventListeners();

    // Display a welcome message to the user.
    displayMessage('Welcome to Campus Navigator! Search, click markers, or get directions.', 'info');
}

/**
 * Adds Leaflet markers for all predefined campus locations to the map.
 * Each marker has a popup bound to it, displaying location details and a "Get Directions" button.
 */
function addCampusMarkers() {
    for (const locationName in campusLocations) {
        const locationData = campusLocations[locationName];
        const marker = L.marker(locationData.coords, {
            title: locationName // Used to identify markers on click
        }).addTo(map);
        markers.push(marker);

        // Create a popup for each marker with detailed content.
        const popupContent = `
            <div class="info-window-content">
                <h4 class="info-window-title">${locationName}</h4>
                <p class="info-window-description">${locationData.description}</p>
                <button class="info-window-button" onclick="setDestinationAndShowDirections('${locationName}')">
                    Get Directions Here
                </button>
            </div>
        `;
        marker.bindPopup(popupContent);
        // Storing the popup instance is useful if you want to explicitly open/close them later without clicking
        popups.push(marker.getPopup()); 

        // Add a click listener to each marker to update sidebar details
        marker.on('click', () => {
            displayLocationDetails(locationName, locationData.description);
            document.getElementById('search-input').value = locationName;
            clearRoute(); // Clear previous route when a new marker is clicked
            displayMessage('', 'clear'); // Clear any previous status messages
        });
    }
}

/**
 * Clears any currently drawn route polyline from the map.
 */
function clearRoute() {
    if (currentRouteLayer) {
        map.removeLayer(currentRouteLayer);
        currentRouteLayer = null;
    }
}

/**
 * Displays detailed information about a selected campus location in the sidebar panel.
 * @param {string} locationName - The name of the location.
 * @param {string} description - The description of the location.
 */
function displayLocationDetails(locationName, description) {
    const locationDetailsDiv = document.getElementById('location-details');
    locationDetailsDiv.innerHTML = `
        <p class="text-content-title">${locationName}</p>
        <p>${description}</p>
        <p class="text-content-coords">Coordinates: ${campusLocations[locationName].coords[0].toFixed(4)}, ${campusLocations[locationName].coords[1].toFixed(4)}</p>
    `;
}

/**
 * Sets the destination input field and attempts to calculate directions.
 * This function is typically called from a marker's popup.
 * @param {string} destinationName - The name of the destination location.
 */
function setDestinationAndShowDirections(destinationName) {
    document.getElementById('destination-input').value = destinationName;
    if (!document.getElementById('origin-input').value) {
        displayMessage('Please enter your starting location or use "Use My Location".', 'warning');
    }
    const selectedTravelMode = document.getElementById('travel-mode-select').value;
    calculateAndDisplayRoute(
        document.getElementById('origin-input').value,
        document.getElementById('destination-input').value,
        selectedTravelMode
    );
}

/**
 * Sets up all event listeners for user interface elements.
 */
function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const quickLinkButtons = document.querySelectorAll('.quick-link-button');
    const getDirectionsButton = document.getElementById('get-directions-button');
    const useMyLocationButton = document.getElementById('use-my-location-button');
    const clearMapButton = document.getElementById('clear-map-button');
    const originInput = document.getElementById('origin-input');
    const destinationInput = document.getElementById('destination-input');
    const travelModeSelect = document.getElementById('travel-mode-select');

    // Event listener for the search button click.
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            const foundLocationName = Object.keys(campusLocations).find(
                key => key.toLowerCase().includes(query.toLowerCase())
            );

            if (foundLocationName) {
                const locationData = campusLocations[foundLocationName];
                displayLocationDetails(foundLocationName, locationData.description);
                map.setView(locationData.coords, INITIAL_ZOOM); // Pan map to location
                
                // Open the corresponding marker's popup
                markers.forEach(marker => {
                    if (marker.options.title === foundLocationName) {
                        marker.openPopup();
                    }
                });

                clearRoute();
                displayMessage(`Found: ${foundLocationName}`, 'success');
            } else {
                document.getElementById('location-details').innerHTML = `<p class="text-error">Location "${query}" not found. Please try another search.</p>`;
                displayMessage(`Location "${query}" not found.`, 'error');
            }
        } else {
            document.getElementById('location-details').innerHTML = `<p class="text-warning">Please enter a location to search.</p>`;
            displayMessage('Please enter a location to search.', 'warning');
        }
    });

    // Event listener for pressing Enter in the search input field.
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });

    // Event listeners for quick link buttons.
    quickLinkButtons.forEach(button => {
        button.addEventListener('click', () => {
            const locationName = button.dataset.location;
            if (locationName && campusLocations[locationName]) {
                const locationData = campusLocations[locationName];
                displayLocationDetails(locationName, locationData.description);
                searchInput.value = locationName; // Populate search bar

                map.setView(locationData.coords, INITIAL_ZOOM); // Pan map to location
                markers.forEach(marker => {
                    if (marker.options.title === locationName) {
                        marker.openPopup();
                    }
                });

                clearRoute();
                displayMessage(`Quick link to: ${locationName}`, 'info');
            }
        });
    });

    // Event listener for the "Use My Location" button.
    useMyLocationButton.addEventListener('click', getCurrentLocation);

    // Event listener for the "Get Directions" button.
    getDirectionsButton.addEventListener('click', () => {
        const origin = originInput.value.trim();
        const destination = destinationInput.value.trim();
        const selectedTravelMode = travelModeSelect.value;

        if (origin && destination) {
            calculateAndDisplayRoute(origin, destination, selectedTravelMode);
        } else {
            document.getElementById('location-details').innerHTML = `<p class="text-warning">Please enter both origin and destination for directions.</p>`;
            displayMessage('Please enter both origin and destination for directions.', 'warning');
        }
    });

    // Event listener for the "Clear Map" button.
    clearMapButton.addEventListener('click', clearMap);
}

/**
 * Attempts to get the user's current geographical position using the Geolocation API.
 * Adds a marker for the user's location and populates the origin input field.
 */
function getCurrentLocation() {
    displayMessage('Getting your current location...', 'info');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const userLatLng = [lat, lng];

                // Remove existing user location marker if any
                if (userLocationMarker) {
                    map.removeLayer(userLocationMarker);
                }

                // Add a custom div icon for the user's current location
                const userIcon = L.divIcon({
                    className: 'leaflet-div-icon', // Custom class for styling
                    iconSize: [20, 20],
                    html: '' // No inner HTML, just a styled div
                });

                userLocationMarker = L.marker(userLatLng, { icon: userIcon }).addTo(map)
                    .bindPopup("Your current location!")
                    .openPopup();

                map.setView(userLatLng, 16); // Center map on user's location

                // Populate origin input with a readable format or coordinates
                document.getElementById('origin-input').value = `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                displayMessage('Current location set.', 'success');
            },
            (error) => {
                let errorMessage = 'Error getting location: ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "User denied the request for Geolocation. Please allow location access.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "The request to get user location timed out.";
                        break;
                    case error.UNKNOWN_ERROR:
                        errorMessage += "An unknown error occurred.";
                        break;
                }
                displayMessage(errorMessage, 'error');
                console.error(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        displayMessage('Geolocation is not supported by your browser.', 'error');
    }
}

/**
 * Geocodes an address string to coordinates using Nominatim API (OpenStreetMap).
 * This function handles both predefined campus locations and arbitrary addresses.
 * IMPORTANT: Public Nominatim API has usage policies. For production, consider
 * hosting your own instance or using a paid/freemium geocoding service.
 * @param {string} query - The address string to geocode.
 * @returns {Promise<Array|null>} A promise that resolves to [lat, lng] or null if not found.
 */
async function geocodeAddress(query) {
    // 1. Check if query matches a known campus location directly
    for (const key in campusLocations) {
        if (key.toLowerCase() === query.toLowerCase()) {
            return campusLocations[key].coords;
        }
    }

    // 2. Check if query contains a known campus location substring
    const foundCampusKey = Object.keys(campusLocations).find(
        key => query.toLowerCase().includes(key.toLowerCase()) || 
               campusLocations[key].description.toLowerCase().includes(query.toLowerCase())
    );
    if (foundCampusKey) {
        return campusLocations[foundCampusKey].coords;
    }

    // 3. Special handling for "My Location" if set by the geolocation function
    if (query.startsWith('My Location (') && userLocationMarker) {
        return [userLocationMarker.getLatLng().lat, userLocationMarker.getLatLng().lng];
    }
    
    // 4. Fallback to Nominatim for arbitrary addresses
    displayMessage(`Geocoding "${query}" with Nominatim...`, 'info');
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    try {
        const response = await fetch(nominatimUrl, { headers: { 'User-Agent': 'CampusNavigatorApp/1.0 (your_email@example.com)' }}); // Replace with your actual email
        if (!response.ok) {
            throw new Error(`Nominatim HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.length > 0) {
            displayMessage('Address geocoded successfully.', 'success');
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        } else {
            displayMessage(`Could not geocode "${query}". No results from Nominatim.`, 'warning');
            return null;
        }
    } catch (error) {
        displayMessage(`Error geocoding address: ${error.message}`, 'error');
        console.error('Nominatim geocoding error:', error);
        return null;
    }
}

/**
 * Calculates and displays a route between two points on the map using the OSRM API.
 * Provides user feedback for loading, success, and various error scenarios.
 * @param {string} originStr - The starting point as a string (address or location name).
 * @param {string} destinationStr - The ending point as a string (address or location name).
 * @param {string} travelMode - The mode of travel (e.g., 'WALKING', 'DRIVING', 'BICYCLING').
 */
async function calculateAndDisplayRoute(originStr, destinationStr, travelMode) {
    displayMessage('Calculating directions with OSRM...', 'info');
    clearRoute(); // Always clear previous route before drawing a new one

    // Geocode origin and destination strings to coordinates
    const originCoords = await geocodeAddress(originStr);
    const destinationCoords = await geocodeAddress(destinationStr);

    if (!originCoords) {
        displayMessage('Origin could not be determined. Please refine your starting point.', 'error');
        return;
    }
    if (!destinationCoords) {
        displayMessage('Destination could not be determined. Please refine your destination.', 'error');
        return;
    }

    // OSRM API endpoint (public demo server)
    // Travel modes: 'driving', 'walking', 'cycling'
    const osrmMode = travelMode.toLowerCase();
    const OSRM_URL = `https://router.project-osrm.org/route/v1/${osrmMode}/`;
    const waypoints = `${originCoords[1]},${originCoords[0]};${destinationCoords[1]},${destinationCoords[0]}`; // OSRM expects [lng, lat]
    const url = `${OSRM_URL}${waypoints}?overview=full&steps=true&geometries=geojson`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Handle HTTP errors (e.g., 404, 500) from OSRM server
            throw new Error(`OSRM service error: ${response.statusText || response.status}`);
        }
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const routeGeometry = route.geometry; // GeoJSON LineString
            const routeCoordinates = routeGeometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng] for Leaflet

            // Add the route to the map as a polyline layer
            currentRouteLayer = L.polyline(routeCoordinates, {
                color: '#4A90E2', // Blue route line, defined in custom CSS
                weight: 7,
                opacity: 0.8
            }).addTo(map);

            // Fit the map view to the bounds of the drawn route
            map.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] }); // Add padding

            // Display textual directions in the sidebar
            let directionsHtml = `<h4 class="text-content-title">Directions (${travelMode.toLowerCase()})</h4>`;
            
            directionsHtml += `<div class="direction-summary">`;
            directionsHtml += `<span>Distance: <span class="direction-value">${(route.distance / 1000).toFixed(2)} km</span></span>`;
            directionsHtml += `<span>Duration: <span class="direction-value">${formatDuration(route.duration)}</span></span>`;
            directionsHtml += `</div>`;

            if (route.legs && route.legs.length > 0) {
                directionsHtml += `<ol class="direction-steps">`;
                route.legs[0].steps.forEach(step => {
                    directionsHtml += `<li>${step.maneuver.instruction} (<span class="direction-step-distance">${(step.distance / 1000).toFixed(2)} km</span>)</li>`;
                });
                directionsHtml += `</ol>`;
            } else {
                directionsHtml += `<p class="text-warning">No detailed steps available for this route.</p>`;
            }

            document.getElementById('location-details').innerHTML = directionsHtml;
            displayMessage('Directions loaded successfully!', 'success');

        } else if (data.code === 'NoRoute') {
            displayMessage(`No route could be found between the specified points for ${travelMode.toLowerCase()}.`, 'warning');
            document.getElementById('location-details').innerHTML = `<p class="text-error">No route found for the selected locations and travel mode. Try different points.</p>`;
        } else {
            // Generic OSRM API error
            displayMessage(`OSRM routing error: ${data.code || 'Unknown'}. ${data.message || 'Please try again.'}`, 'error');
            document.getElementById('location-details').innerHTML = `<p class="text-error">An error occurred during routing. Check your inputs.</p>`;
        }

    } catch (error) {
        displayMessage(`Failed to get directions: ${error.message}.`, 'error');
        document.getElementById('location-details').innerHTML = `<p class="text-error">Error fetching directions. See console for details.</p>`;
        console.error('OSRM directions fetch error:', error);
    }
}

/**
 * Formats duration from seconds into a human-readable string (e.g., 1h 30m).
 * @param {number} seconds - Duration in seconds.
 * @returns {string} Formatted duration string.
 */
function formatDuration(seconds) {
    if (seconds < 0) seconds = 0;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    let result = [];
    if (hours > 0) result.push(`${hours}h`);
    if (minutes > 0) result.push(`${minutes}m`);
    // Only add seconds if it's the only unit or non-zero and small duration
    if (remainingSeconds > 0 && result.length === 0 || (remainingSeconds > 0 && hours === 0 && minutes === 0)) result.push(`${remainingSeconds}s`);
    
    if (result.length === 0) return '0s'; // Handle cases where duration is truly zero
    return result.join(' ');
}


/**
 * Clears the map (route, popups, user marker), resets input fields, and messages.
 */
function clearMap() {
    clearRoute(); // Clear directions from map

    // Close all popups
    map.closePopup();

    // Remove user location marker if it exists
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
        userLocationMarker = null;
    }

    map.setView(CAMPUS_CENTER, INITIAL_ZOOM); // Reset map center and zoom

    // Clear input fields
    document.getElementById('search-input').value = '';
    document.getElementById('origin-input').value = '';
    document.getElementById('destination-input').value = '';
    document.getElementById('travel-mode-select').value = 'WALKING'; // Reset travel mode

    // Reset location details and messages
    document.getElementById('location-details').innerHTML = `<p>Search for a building, click a map marker, or get directions.</p>`;
    displayMessage('Map cleared. Ready for new exploration!', 'info');
}

/**
 * Displays a temporary message to the user in the designated message area.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('info', 'success', 'warning', 'error', 'clear').
 */
function displayMessage(message, type) {
    const messageArea = document.getElementById('message-area');
    messageArea.className = 'min-h-[2.5rem] p-3 mb-4 rounded-lg text-sm font-medium flex items-center justify-center text-center'; // Reset base Tailwind classes
    messageArea.textContent = message;

    switch (type) {
        case 'info':
            messageArea.classList.add('message-info'); // Custom CSS class for colors
            break;
        case 'success':
            messageArea.classList.add('message-success');
            break;
        case 'warning':
            messageArea.classList.add('message-warning');
            break;
        case 'error':
            messageArea.classList.add('message-error');
            break;
        case 'clear':
            messageArea.textContent = '';
            // No specific background/text color classes needed if cleared
            break;
    }
    // Optionally clear message after a few seconds, unless it's a persistent error
    if (type !== 'error' && type !== 'warning' && message !== '') {
        setTimeout(() => {
            messageArea.textContent = '';
            messageArea.className = 'min-h-[2.5rem] p-3 mb-4 rounded-lg text-sm font-medium flex items-center justify-center text-center'; // Reset to base classes
        }, 5000);
    }
}

// Initial map setup when the DOM is ready
document.addEventListener('DOMContentLoaded', initMap);
