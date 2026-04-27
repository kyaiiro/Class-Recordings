import { URLSearchParams } from 'url';

const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.MICROSOFT_REFRESH_TOKEN;
const DRIVE_ID = process.env.ONEDRIVE_DRIVE_ID;
const ITEM_ID = process.env.ONEDRIVE_ITEM_ID;

async function getAccessToken() {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('refresh_token', REFRESH_TOKEN);
    params.append('grant_type', 'refresh_token');
    params.append('scope', 'Files.Read.All');

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        body: params,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
}

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
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !DRIVE_ID || !ITEM_ID) {
        return res.status(500).json({
            error: 'Missing configuration',
            message: 'Please set Microsoft credentials in environment variables'
        });
    }

    try {
        // Get access token using refresh token
        const accessToken = await getAccessToken();

        // Fetch files from OneDrive
        const apiUrl = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${ITEM_ID}/children`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Graph API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Filter for video files
        const videoExtensions = ['.mp4', '.webm', '.mov', '.ogv', '.mkv', '.avi'];
        const videos = [];

        if (data.value) {
            for (const item of data.value) {
                const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
                if (videoExtensions.includes(ext)) {
                    // Build download URL with proper authorization
                    const downloadUrl = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${item.id}/content`;
                    const videoDate = parseDateFromFilename(item.name);

                    videos.push({
                        name: item.name,
                        url: downloadUrl,
                        date: videoDate ? videoDate.toISOString() : null,
                        size: item.size
                    });
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
