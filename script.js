(function() {
    // ============================================
    // This gallery fetches videos from the backend
    // ============================================
    
    const videoGrid = document.getElementById('videoGrid');
    let loadingDiv = document.getElementById('loadingIndicator');
    
    function showEmptyState(message, isError = false) {
        if (loadingDiv && loadingDiv.parentNode) loadingDiv.remove();
        if (videoGrid) {
            videoGrid.innerHTML = '';
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            if (isError) emptyDiv.style.border = '1px solid #ff7e6e66';
            emptyDiv.innerHTML = `
                <svg width="58" height="58" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#93a9d4" stroke-width="1.4" stroke-linecap="round"/>
                    <circle cx="12" cy="12" r="9" stroke="#6b8fcb" stroke-width="1" stroke-dasharray="2 2"/>
                </svg>
                <h3>${isError ? '⚠️ cannot fetch videos' : 'Error fetching videos, refresh page'}</h3>
                <p>${message}</p>
            `;
            videoGrid.appendChild(emptyDiv);
        }
    }
    
    // Fetch videos from the backend API
    async function getVideosFromBackend() {
        try {
            console.log("Fetching videos from backend API...");
            const response = await fetch('/api/videos');
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `API returned ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.videos || data.videos.length === 0) {
                console.log("No videos found");
                return [];
            }
            
            // Parse dates from ISO strings and sort
            const videos = data.videos.map(v => ({
                ...v,
                date: v.date ? new Date(v.date) : null
            }));
            
            videos.sort((a, b) => {
                if (a.date && b.date) return b.date - a.date;
                if (a.date && !b.date) return -1;
                if (!a.date && b.date) return 1;
                return a.name.localeCompare(b.name);
            });
            
            return videos;
            
        } catch (error) {
            console.error("Error fetching videos from backend:", error);
            throw error;
        }
    }
    
    function formatTitleWithSlashes(title) {
        if (title.includes(' ') && !title.includes('/')) {
            const parts = title.split(' ');
            if (parts.length === 3 && parts.every(part => /^\d+$/.test(part))) {
                return parts.join('/');
            }
        }
        
        const numberPattern = /(\d+)[\s-._](\d+)[\s-._](\d+)/;
        const match = title.match(numberPattern);
        if (match) {
            return `${match[1]}/${match[2]}/${match[3]}`;
        }
        
        return title;
    }
    
    function getPrettyTitle(fileName) {
        let base = fileName.split('/').pop();
        const lastDot = base.lastIndexOf('.');
        let rawName = lastDot !== -1 ? base.substring(0, lastDot) : base;
        try {
            rawName = decodeURIComponent(rawName);
        } catch(e) { }
        
        rawName = rawName.replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (rawName === "") rawName = "untitled_media";
        rawName = formatTitleWithSlashes(rawName);

        rawName = base.split(".")[0] + " " + rawName;
        
        return rawName;
    }
    
    function renderVideoCards(videos) {
        if (loadingDiv && loadingDiv.parentNode) loadingDiv.remove();
        if (videoGrid) {
            videoGrid.innerHTML = '';
            
            videos.forEach(video => {
                console.log(`Found video: ${video.name}`);
                
                const card = document.createElement('div');
                card.className = 'video-card';
                
                const prettyTitle = getPrettyTitle(video.name);
                const dateStr = video.date ? new Date(video.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }) : '';
                
                card.innerHTML = `
                    <div class="video-title">${prettyTitle}</div>
                    <div class="video-wrapper">
                        <video controls preload="metadata" poster="">
                            <source src="${video.url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div class="video-meta">
                        ${dateStr ? `<span class="date-badge">📅 ${dateStr}</span>` : ''}
                    </div>
                `;
                
                videoGrid.appendChild(card);
            });
        }
    }
    
    async function initDarkGallery() {
        try {
            console.log("Initializing video gallery...");
            console.log("Fetching videos from backend...");
            
            if (!loadingDiv || !loadingDiv.parentNode) {
                const maybeLoad = document.getElementById('loadingIndicator');
                if (maybeLoad) loadingDiv = maybeLoad;
                else if (videoGrid) {
                    const newLoader = document.createElement('div');
                    newLoader.className = 'empty-state';
                    newLoader.id = 'loadingIndicator';
                    newLoader.innerHTML = `<div class="loader-spinner"></div><h3>scanning video archive</h3><p>Fetching videos from storage...</p>`;
                    videoGrid.innerHTML = '';
                    videoGrid.appendChild(newLoader);
                    loadingDiv = newLoader;
                }
            }
            
            const videoList = await getVideosFromBackend();
            
            if (videoList.length === 0) {
                showEmptyState(`No video files found in your storage.\n\nSupported formats: mp4, webm, mov, ogv, mkv, avi`, false);
            } else {
                renderVideoCards(videoList);
            }
            
        } catch (error) {
            console.error("Gallery initialization error:", error);
            if (loadingDiv && loadingDiv.parentNode) loadingDiv.remove();
            
            let userMessage = `Error loading videos: ${error.message}\n\n`;
            userMessage += `Troubleshooting:\n\n`;
            userMessage += `1️⃣ Make sure the backend API is configured\n`;
            userMessage += `   Check that environment variables are set on Vercel\n\n`;
            userMessage += `2️⃣ Verify your GitHub repository is set up\n`;
            userMessage += `   Check GITHUB_OWNER and GITHUB_REPO environment variables\n\n`;
            userMessage += `3️⃣ Open browser console (F12) to see detailed errors`;
            
            showEmptyState(userMessage, true);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDarkGallery);
    } else {
        initDarkGallery();
    }
})();