// js/api/imageSearch.js
import { getAppConfig } from '../config.js';

export async function fetchDishImage(keyword, dishName = '') {
    const config = getAppConfig();
    const searchTerm = keyword || dishName || 'delicious food';

    // 1. 如果用户设置了 Google Custom Search API Key，优先调用 Google 官方搜图
    if (config.googleApiKey && config.googleCx) {
        try {
            const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(searchTerm)}&cx=${config.googleCx}&key=${config.googleApiKey}&searchType=image&num=1`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                return data.items[0].link;
            }
        } catch (err) {
            console.warn('[Google Image Search] 搜索失败，降级使用智能高精美食图源:', err);
        }
    }

    // 2. 替代 Unsplash 废弃接口的高清美食匹配源 (Pollinations / LoremFlickr)
    const encodedTag = encodeURIComponent(searchTerm);
    return `https://image.pollinations.ai/prompt/delicious%20food%20photo%20of%20${encodedTag}?width=400&height=300&nologo=true`;
}
