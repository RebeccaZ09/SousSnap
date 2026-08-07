// js/api/imageSearch.js
import { getAppConfig } from '../config.js';

export async function fetchDishImage(searchKeyword, dishName = '') {
    const config = getAppConfig();
    const query = searchKeyword || dishName || 'delicious food';

    // Check if Google Custom Search keys are provided
    if (config.googleApiKey && config.googleCx) {
        try {
            const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${config.googleCx}&searchType=image&num=1&key=${config.googleApiKey}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.items && data.items.length > 0) {
                return data.items[0].link;
            }
        } catch (err) {
            console.warn("Google Image Search error, falling back to Unsplash:", err);
        }
    }

    // Option A Fallback: Unsplash Source API
    return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
}
