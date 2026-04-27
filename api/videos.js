const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function parseDateFromFilename(filename) {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    const datePatterns = [
        /(\d{1,2})[-._](\d{1,2})[-._](\d{2,4})/,
        /(\d{4})[-._](\d{1,2})[-._](\d{1,2})/
    ];
    
    for (const pattern of datePatterns) {
        const match = nameWithoutExt.match(pattern);
        if (match) {
            let day, month, year;
            
            if (match[1].length === 4) {
                year = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                day = parseInt(match[3]);
            } else {
                day = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                year = parseInt(match[3]);
                if (year < 100) year = 2000 + year;
            }
            
            if (day && !isNaN(month) && year) {
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) return date;
            }
        }
    }
    return null;
}

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check for required environment variables
    if (!GITHUB_OWNER || !GITHUB_REPO) {
        return res.status(500).json({
            error: 'Missing configuration',
            message: 'Please set GITHUB_OWNER and GITHUB_REPO in environment variables'
        });
    }

    try {
        // Fetch releases from GitHub API
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Video Gallery'
        };

        // Add auth token if available (increases rate limit)
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
        
        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
        }

        const releases = await response.json();

        // Filter for video files across all releases
        const videoExtensions = ['.mp4', '.webm', '.mov', '.ogv', '.mkv', '.avi'];
        const videos = [];

        for (const release of releases) {
            if (release.assets && release.assets.length > 0) {
                for (const asset of release.assets) {
                    const ext = asset.name.substring(asset.name.lastIndexOf('.')).toLowerCase();
                    if (videoExtensions.includes(ext)) {
                        const videoDate = parseDateFromFilename(asset.name);

                        videos.push({
                            name: asset.name,
                            url: asset.browser_download_url,
                            date: videoDate ? videoDate.toISOString() : release.published_at,
                            size: asset.size,
                            release: release.name || release.tag_name
                        });
                    }
                }
            }
        }

        // Sort by date (newest first)
        videos.sort((a, b) => {
            if (a.date && b.date) return new Date(b.date) - new Date(a.date);
            if (a.date && !b.date) return -1;
            if (!a.date && b.date) return 1;
            return a.name.localeCompare(b.name);
        });

        return res.status(200).json({ videos });

    } catch (error) {
        console.error('Error fetching videos:', error);
        return res.status(500).json({
            error: 'Failed to fetch videos',
            message: error.message
        });
    }
}
