// Authentication functions
function toggleForms() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('signup-form').classList.toggle('hidden');
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            loadSongs();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
}

async function signup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const email = document.getElementById('signup-email').value;

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email })
        });
        const data = await response.json();
        
        if (data.success) {
            alert('Account created successfully! Please login.');
            toggleForms();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Signup failed. Please try again.');
    }
}

async function logout() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
    // Clear any user data or tokens here
}

// Playlist and song management
async function loadPlaylists() {
    try {
        const response = await fetch('/api/playlists', {
            credentials: 'include'
        });
        const playlists = await response.json();
        renderPlaylists(playlists);
    } catch (error) {
        console.error('Error loading playlists:', error);
    }
}

function renderPlaylists(playlists) {
    const container = document.getElementById('playlists');
    container.innerHTML = '';
    
    playlists.forEach(playlist => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
            <h3>${playlist.name}</h3>
            <p>${playlist.song_count} songs</p>
        `;
        card.onclick = () => playPlaylist(playlist);
        container.appendChild(card);
    });
}

// Simulated playlist for Next/Previous functionality
let playlist = [];
let currentSongIndex = -1;
let isShuffled = false;
let originalPlaylist = []; // To store the original order

// Load and display all songs on the main screen with song icon
async function loadSongs() {
    try {
        const response = await fetch('/api/songs', { credentials: 'include' });
        const songs = await response.json();
        playlist = songs;
        originalPlaylist = [...songs]; // Store the original order
        renderSongs(songs);
    } catch (error) {
        console.error('Error loading songs:', error);
    }
}

// Track the currently playing song
let currentPlayingSong = null;

function renderSongs(songs) {
    const container = document.getElementById('playlists');
    container.innerHTML = '';
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.dataset.songPath = song.file_path;
        card.dataset.index = index;
        card.innerHTML = `
            <div class="song-art-gradient" style="cursor:pointer;">
                <span class="song-initials">${(song.title && song.title[0]) ? song.title[0].toUpperCase() : '?'}</span>
            </div>
            <div class="song-title" title="${song.title}" style="cursor:pointer;">${song.title}</div>
            <div class="song-artist" title="${song.artist}">${song.artist}</div>
            <div class="play-btn-overlay" style="cursor:pointer;">
                <i class="bi bi-play-fill" style="font-size:1.5rem;color:#fff;margin-left:4px;"></i>
            </div>
        `;
        card.onclick = () => {
            currentSongIndex = index;
            playSongInPlayerBar(song.file_path, song.title, song.artist);
            updateNavigationButtons();
        };
        container.appendChild(card);
    });
}

function renderSearchResults(songs) {
    const container = document.getElementById('playlists');
    container.innerHTML = '';
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.dataset.songPath = song.file_path;
        card.dataset.index = index;
        card.innerHTML = `
            <div class="song-art-gradient" style="cursor:pointer;">
                <span class="song-initials">${(song.title && song.title[0]) ? song.title[0].toUpperCase() : '?'}</span>
            </div>
            <div class="song-title" title="${song.title}" style="cursor:pointer;">${song.title}</div>
            <div class="song-artist" title="${song.artist}">${song.artist}</div>
            <div class="play-btn-overlay" style="cursor:pointer;">
                <i class="bi bi-play-fill" style="font-size:1.5rem;color:#fff;margin-left:4px;"></i>
            </div>
        `;
        card.onclick = () => {
            currentSongIndex = index;
            playSongInPlayerBar(song.file_path, song.title, song.artist);
            updateNavigationButtons();
        };
        container.appendChild(card);
    });
}

// Theme Toggle Functionality
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize Theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Toggle Player Expanded State
function togglePlayer() {
    const player = document.querySelector('.player');
    const toggleBtn = document.getElementById('togglePlayerBtn');
    player.classList.toggle('expanded');
    // Update the chevron icon based on the expanded state
    if (player.classList.contains('expanded')) {
        toggleBtn.innerHTML = '<i class="bi bi-chevron-down"></i>';
    } else {
        toggleBtn.innerHTML = '<i class="bi bi-chevron-up"></i>';
    }
}

// Add Ripple Effect to Buttons
function addRippleEffect(e) {
    const button = e.currentTarget;
    button.classList.add('ripple');
}

// Update Navigation Buttons State
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    prevBtn.disabled = currentSongIndex <= 0;
    nextBtn.disabled = currentSongIndex >= playlist.length - 1;
}

// Shuffle Playlist
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[i], array[j]];
    }
    return array;
}

function toggleShuffle() {
    const shuffleBtn = document.getElementById('shuffleBtn');
    isShuffled = !isShuffled;
    if (isShuffled) {
        shuffleBtn.classList.add('active');
        // Store the current song to maintain continuity
        const currentSong = playlist[currentSongIndex];
        // Create a new shuffled playlist excluding the current song
        let tempPlaylist = playlist.filter((_, index) => index !== currentSongIndex);
        tempPlaylist = shuffleArray([...tempPlaylist]);
        // Reinsert the current song at the beginning
        tempPlaylist.unshift(currentSong);
        playlist = tempPlaylist;
        currentSongIndex = 0;
    } else {
        shuffleBtn.classList.remove('active');
        // Restore the original playlist
        const currentSong = playlist[currentSongIndex];
        playlist = [...originalPlaylist];
        // Find the current song in the original playlist
        currentSongIndex = playlist.findIndex(song => song.file_path === currentSong.file_path);
    }
    updateNavigationButtons();
}

// Play Next Song
function playNext() {
    if (currentSongIndex < playlist.length - 1) {
        currentSongIndex++;
        const song = playlist[currentSongIndex];
        playSongInPlayerBar(song.file_path, song.title, song.artist);
        updateNavigationButtons();
    }
}

// Play Previous Song
function playPrevious() {
    if (currentSongIndex > 0) {
        currentSongIndex--;
        const song = playlist[currentSongIndex];
        playSongInPlayerBar(song.file_path, song.title, song.artist);
        updateNavigationButtons();
    }
}

// Navigation Functions
function showHome() {
    const sidebarItems = document.querySelectorAll('.sidebar li');
    sidebarItems.forEach(item => item.classList.remove('active'));
    sidebarItems[0].classList.add('active'); // Highlight Home
    document.getElementById('searchBox').value = ''; // Clear search
    loadSongs(); // Reload all songs
}

async function showSearch() {
    const sidebarItems = document.querySelectorAll('.sidebar li');
    sidebarItems.forEach(item => item.classList.remove('active'));
    sidebarItems[1].classList.add('active'); // Highlight Search

    const searchBox = document.getElementById('searchBox');
    searchBox.focus();

    searchBox.addEventListener('input', async () => {
        const query = searchBox.value.trim().toLowerCase();
        if (query === '') {
            loadSongs(); // Show all songs if search is empty
            return;
        }

        try {
            const response = await fetch('/api/songs', { credentials: 'include' });
            const songs = await response.json();
            const filteredSongs = songs.filter(song =>
                song.title.toLowerCase().includes(query) ||
                song.artist.toLowerCase().includes(query)
            );
            renderSearchResults(filteredSongs);
        } catch (error) {
            console.error('Error searching songs:', error);
        }
    });
}

async function showLibrary() {
    const sidebarItems = document.querySelectorAll('.sidebar li');
    sidebarItems.forEach(item => item.classList.remove('active'));
    sidebarItems[2].classList.add('active'); // Highlight Library

    try {
        // Simulated API call for user's library
        const response = await fetch('/api/library', { credentials: 'include' });
        const librarySongs = await response.json();
        renderSongs(librarySongs); // Reuse renderSongs for library
    } catch (error) {
        console.error('Error loading library:', error);
        const container = document.getElementById('playlists');
        container.innerHTML = '<p>No songs in your library yet.</p>';
    }
}

// Helper function to format time in MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Fix: Ensure playBtn and audio are initialized after DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initializeTheme();

    const audio = document.getElementById('main-audio');
    const playBtn = document.getElementById('togglePlayBtn');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const progressBar = document.getElementById('customProgressBar');
    const progress = document.getElementById('customProgress');
    const player = document.querySelector('.player');
    const playerArtwork = document.querySelector('.player-artwork');
    const playerInfoExpanded = document.querySelector('.player-info-expanded');
    const volumeBar = document.getElementById('customVolumeBar');
    const volume = document.getElementById('customVolume');
    const playerInfo = document.querySelector('.player-info');

    // Theme toggle button with touch support
    const themeToggleBtn = document.getElementById('themeToggle');
    themeToggleBtn.addEventListener('click', toggleTheme);
    themeToggleBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent scrolling
        toggleTheme();
    });
    themeToggleBtn.addEventListener('click', addRippleEffect);
    themeToggleBtn.addEventListener('touchstart', addRippleEffect);

    // Toggle player button
    const togglePlayerBtn = document.getElementById('togglePlayerBtn');
    togglePlayerBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent the click from bubbling to the player
        togglePlayer();
    });
    togglePlayerBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        togglePlayer();
    });
    togglePlayerBtn.addEventListener('click', addRippleEffect);
    togglePlayerBtn.addEventListener('touchstart', addRippleEffect);

    // Add click listener to the entire playbar to toggle expanded state
    player.addEventListener('click', function(e) {
        // Only toggle if the player is not already expanded
        if (!player.classList.contains('expanded')) {
            togglePlayer();
        }
    });

    // Add touch support for toggling the playbar
    player.addEventListener('touchstart', function(e) {
        // Only toggle if the player is not already expanded
        if (!player.classList.contains('expanded')) {
            e.preventDefault();
            togglePlayer();
        }
    });

    // Prevent clicks on specific controls from triggering the playbar toggle
    const controls = [playBtn, togglePlayerBtn, progressBar, volumeBar, document.getElementById('prevBtn'), document.getElementById('nextBtn'), document.getElementById('shuffleBtn')];
    controls.forEach(control => {
        control.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent the click from bubbling to the player
        });
        control.addEventListener('touchstart', function(e) {
            e.stopPropagation(); // Prevent the touch event from bubbling
        });
    });

    // Next and Previous buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    prevBtn.addEventListener('click', playPrevious);
    prevBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        playPrevious();
    });
    prevBtn.addEventListener('click', addRippleEffect);
    prevBtn.addEventListener('touchstart', addRippleEffect);
    nextBtn.addEventListener('click', playNext);
    nextBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        playNext();
    });
    nextBtn.addEventListener('click', addRippleEffect);
    nextBtn.addEventListener('touchstart', addRippleEffect);

    // Shuffle button
    const shuffleBtn = document.getElementById('shuffleBtn');
    shuffleBtn.addEventListener('click', toggleShuffle);
    shuffleBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        toggleShuffle();
    });
    shuffleBtn.addEventListener('click', addRippleEffect);
    shuffleBtn.addEventListener('touchstart', addRippleEffect);

    // Volume control
    volumeBar.addEventListener('click', function(e) {
        const rect = volumeBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        audio.volume = percent;
        volume.style.width = (percent * 100) + '%';
    });

    // Volume control for touch
    volumeBar.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = volumeBar.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const percent = x / rect.width;
        audio.volume = percent;
        volume.style.width = (percent * 100) + '%';
    });

    // Update volume bar when audio volume changes
    audio.addEventListener('volumechange', () => {
        volume.style.width = (audio.volume * 100) + '%';
    });

    // Progress bar control
    progressBar.addEventListener('click', function(e) {
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        audio.currentTime = percent * audio.duration;
        progress.style.width = (percent * 100) + '%';
    });

    // Progress bar control for touch
    progressBar.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = progressBar.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const percent = x / rect.width;
        audio.currentTime = percent * audio.duration;
        progress.style.width = (percent * 100) + '%';
    });

    // Update progress bar and time as the song plays
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progress.style.width = percent + '%';
            currentTimeEl.textContent = formatTime(audio.currentTime);
            durationEl.textContent = formatTime(audio.duration);
        }
    });

    // Set duration when metadata is loaded
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    // Add ripple effect to other buttons
    playBtn.addEventListener('click', addRippleEffect);
    playBtn.addEventListener('touchstart', addRippleEffect);
    document.querySelectorAll('.auth-form button').forEach(btn => {
        btn.addEventListener('click', addRippleEffect);
        btn.addEventListener('touchstart', addRippleEffect);
    });

    function updateToggleBtn() {
        if (audio.paused || audio.ended) {
            playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
            playBtn.classList.remove('paused');
        } else {
            playBtn.innerHTML = '<i class="bi bi-pause"></i>';
            playBtn.classList.add('paused');
        }
    }

    playBtn.onclick = () => {
        if (!audio.src) {
            alert('Please select a song first');
            return;
        }
        if (audio.paused || audio.ended) {
            audio.play();
        } else {
            audio.pause();
        }
        updateToggleBtn();
    };

    playBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (!audio.src) {
            alert('Please select a song first');
            return;
        }
        if (audio.paused || audio.ended) {
            audio.play();
        } else {
            audio.pause();
        }
        updateToggleBtn();
    });

    audio.addEventListener('play', () => {
        updateToggleBtn();
        updatePlayingState();
    });
    audio.addEventListener('pause', () => {
        updateToggleBtn();
        updatePlayingState();
    });
    audio.addEventListener('ended', () => {
        updateToggleBtn();
        updatePlayingState();
        // Auto-play next song when current song ends
        playNext();
    });

    window.playSongInPlayerBar = function(file_path, title, artist) {
        audio.src = `/songs/${file_path}`;
        audio.style.display = 'inline-block';
        audio.play();
        document.getElementById('currentSong').textContent = `Playing: ${title} - ${artist}`;
        // Update expanded player info
        playerInfoExpanded.querySelector('.song-title').textContent = title;
        playerInfoExpanded.querySelector('.song-artist').textContent = artist;
        playerArtwork.querySelector('.song-initials').textContent = title[0]?.toUpperCase() || '?';
        currentPlayingSong = file_path;
        updatePlayingState();
        // Always show the player bar
        player.classList.remove('hidden');
    };

    function updatePlayingState() {
        const cards = document.querySelectorAll('.playlist-card');
        cards.forEach(card => {
            if (card.dataset.songPath === currentPlayingSong && !audio.paused && !audio.ended) {
                card.classList.add('playing');
            } else {
                card.classList.remove('playing');
            }
        });
    }

    // Hide playbar when playback ends
    function hidePlaybars() {
        player.classList.add('hidden');
        currentPlayingSong = null;
        updatePlayingState();
    }

    audio.addEventListener('ended', () => {
        progress.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        // Don't hide playbars here since we auto-play the next song
    });

    audio.addEventListener('pause', () => {
        // Optionally hide playbars on pause if desired
        // hidePlaybars();
    });

    // Hide playbars initially
    hidePlaybars();
});