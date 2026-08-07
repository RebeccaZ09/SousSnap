// js/api/gemini.js
import { getAppConfig, getUserPreferences } from '../config.js';
import { getFavoritesList } from '../modules/favorites.js';

export const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function cleanAndParseJSON(text) {
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
}

// 1. 生成单日三餐
export async function generateDailyPlanner(pantryList = []) {
    return fetchPlanFromGemini(pantryList, 'daily');
}

// 2. 生成一周三餐
export async function generateWeeklyPlanner(pantryList = []) {
    return fetchPlanFromGemini(pantryList, 'weekly');
}

// js/api/gemini.js
export async function scanImageForIngredients(base64Image, apiKey) {
    if (!apiKey) {
        throw new Error('API Key is required');
    }

    const response = await fetch(`${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: "Identify all food ingredients in this image and return a JSON object with key 'items' containing an array of string ingredient names." },
                    { inline_data: { mime_type: "image/png", data: base64Image } }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(text);
}

export async function refineSingleDish(dishName, modificationInstruction, apiKey) {
    if (!apiKey) {
        throw new Error('API Key is required');
    }

    const response = await fetch(`${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `Modify recipe for ${dishName}: ${modificationInstruction}` }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(text);
}

async function fetchPlanFromGemini(pantryList, mode = 'weekly') {
    const config = getAppConfig();
    if (!config.geminiApiKey) {
        throw new Error('请先设置 Gemini API Key！');
    }

    const prefs = getUserPreferences() || {};
    const favorites = getFavoritesList(); // 获取必吃金榜

    const pantryNames = pantryList.map(item => item.name).join(', ') || '常用家庭食材';
    const favoriteNames = favorites.map(item => item.dish_name).join(', ') || '暂无';

    const durationText = mode === 'daily' ? '单日（包含 早餐、午餐、晚餐）' : '一周（周一至周日）';

    const prompt = `
你是一位顶级星级大厨和家庭营养师。请为用户生成 ${durationText} 的精美菜单。

【当前已有食材】：${pantryNames}
【⭐ 必吃金榜（非常重要的偏好菜品，请尽量从中选择或参考其风格）】：${favoriteNames}
【忌口/偏好限制】：${prefs.dietaryRestrictions || '无'}
【餐食习惯】：早餐 ${prefs.bfCuisine || '快手'} (${prefs.bfCount || 1}道)，午餐 ${prefs.lunchCuisine || '家常'} (${prefs.lunchCount || 2}道)，晚餐 ${prefs.dinnerCuisine || '丰富'} (${prefs.dinnerCount || 2}道)。

【严格要求】：
1. 生成菜谱时，**优先并倾向于从【必吃金榜】中挑选合适菜品**融入菜单。
2. 返回格式必须为严格合法的 JSON，不要添加任何 Markdown 或额外文本。

JSON 格式规范：
{
  "weeklyPlan": [
    {
      "day": "${mode === 'daily' ? '今日三餐' : '周一'}",
      "breakfast": [
        { "dish_name": "菜名", "ingredients": ["食材1", "食材2"], "steps": "制作步骤", "image_search_kw": "英文图片关键词" }
      ],
      "lunch": [ ... ],
      "dinner": [ ... ]
    }
  ]
}
`;

    const response = await fetch(`${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${config.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (data.error) throw new Error(`[Gemini API Error]: ${data.error.message}`);
    
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('Gemini 未返回有效内容');

    return cleanAndParseJSON(candidateText);
}
