// js/api/gemini.js
import { getAppConfig, getUserPreferences } from '../config.js';
import { getFavoritesList } from '../modules/favorites.js';

export const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function cleanAndParseJSON(text) {
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
}

// 1. 生成单日三餐
export async function generateDailyPlanner(pantryList = []) {
    return fetchPlanFromGemini(pantryList, 'daily');
}

// 2. 生成五天三餐（周一至周五）
export async function generateWeeklyPlanner(pantryList = []) {
    return fetchPlanFromGemini(pantryList, 'weekly');
}

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
                parts: [{ text: `Modify recipe for ${dishName}:${modificationInstruction}` }]
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
    const favorites = getFavoritesList();

    const pantryNames = pantryList.map(item => item.name).join(', ') || '常用家庭食材';
    const favoriteNames = favorites.map(item => item.dish_name).join(', ') || '暂无';

    const durationText = mode === 'daily' ? '单日（包含 早餐、午餐、晚餐）' : '五天（周一至周五）';
    
    const prompt = `
你是一位顶级星级大厨和家庭营养师。请为用户生成 ${durationText} 的精美菜单。

【当前已有食材】：${pantryNames}
【⭐ 必吃金榜（非常重要的偏好菜品）】：${favoriteNames}
【忌口/偏好限制】：${prefs.dietaryRestrictions || '无'}
【餐食习惯规范（必须严格遵守）】：
1. **早餐**：必须【100% 只从【⭐ 必吃金榜】中挑选】适合早餐的菜品。
2. **午餐**：4岁小朋友带去学校的便当/零食组合。要求：免加热、健康便携，每份包含2~3种轻食食材（例如：奶酪棒、新鲜蓝莓/草莓、小饼干、坚果或小面包等组合）。
3. **晚餐**：${prefs.dinnerCuisine \vert{}\vert{} '丰富'} (${prefs.dinnerCount || 2}道家常菜，优先结合【当前已有食材】)。

【严格输出要求】：
返回格式必须为严格合法的 JSON，不要添加任何 Markdown 或额外文本。

JSON 格式规范：
{
  "weeklyPlan": [
    {
      "day": "${mode === 'daily' ? '今日三餐' : '周一'}",
      "breakfast": [
        { "dish_name": "菜名", "ingredients": ["食材1"], "steps": "制作步骤", "image_search_kw": "breakfast" }
      ],
      "lunch": [
        { "dish_name": "幼儿便当点心组合", "ingredients": ["奶酪棒", "蓝莓", "小饼干"], "steps": "直接清洗并装入便当盒即可。", "image_search_kw": "kids snack bento" }
      ],
      "dinner": [
        { "dish_name": "菜名", "ingredients": ["食材1", "食材2"], "steps": "制作步骤", "image_search_kw": "dinner" }
      ]
    }
  ]
}
`;

    try {
        const response = await fetch(`${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${config.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) throw new Error('Gemini 未返回有效内容');

        return cleanAndParseJSON(candidateText);
    } catch (err) {
        console.warn("Gemini API 高负载或网络异常，启用本地金榜/幼儿便当降级兜底方案:", err.message);

        // 🌟 降级逻辑：固定为 5 天（周一至周五）
        const days = mode === 'daily' ? ['今日三餐'] : ['周一', '周二', '周三', '周四', '周五'];
        
        // 早餐：只从最爱中挑选
        const getFavoriteBreakfast = () => {
            if (favorites && favorites.length > 0) {
                const randomFav = favorites[Math.floor(Math.random() * favorites.length)];
                return {
                    dish_name: randomFav.dish_name,
                    ingredients: randomFav.ingredients && randomFav.ingredients.length > 0 ? randomFav.ingredients : ["精选食材"],
                    steps: randomFav.steps || "按个人喜好烹饪即可。",
                    image_search_kw: "breakfast food"
                };
            }
            return {
                dish_name: "金榜快手早餐",
                ingredients: ["请先去“我的最爱”添加早餐菜品"],
                steps: "在我的最爱中添加菜品后，早餐将优先从此展示。",
                image_search_kw: "simple breakfast"
            };
        };

        // 午餐：4岁小朋友带去学校的便当零食组合（2-3种食材）
        const kidsLunchPool = [
            { dish_name: "水果奶酪便当", ingredients: ["奶酪棒", "草莓", "小馒头"], steps: "将水果洗净，连同奶酪棒和小馒头一起放入便当盒。", image_search_kw: "kids bento box" },
            { dish_name: "健康轻食点心盒", ingredients: ["奶酪块", "小番茄", "全麦饼干"], steps: "直接洗净装盒携带。", image_search_kw: "toddler snack" },
            { dish_name: "果香点心组合", ingredients: ["独立包装纯牛奶", "香蕉段", "动物饼干"], steps: "香蕉切段装入便当盒。", image_search_kw: "kids snack" }
        ];

        // 晚餐：家常菜
        const getDinnerFallback = () => {
            if (favorites && favorites.length > 0 && Math.random() > 0.5) {
                const randomFav = favorites[Math.floor(Math.random() * favorites.length)];
                return {
                    dish_name: randomFav.dish_name,
                    ingredients: randomFav.ingredients || ["精选食材"],
                    steps: randomFav.steps || "按常规步骤烹饪。",
                    image_search_kw: "chinese food"
                };
            }
            return {
                dish_name: "家常快手小炒",
                ingredients: pantryList.length > 0 ? pantryList.slice(0, 3).map(p => p.name) : ["鸡蛋", "西红柿"],
                steps: "1. 准备好食材；2. 热锅下油翻炒调味即可。",
                image_search_kw: "home cooked food"
            };
        };

        const fallbackWeeklyPlan = days.map(dayName => ({
            day: dayName,
            breakfast: [getFavoriteBreakfast()],
            lunch: [kidsLunchPool[Math.floor(Math.random() * kidsLunchPool.length)]],
            dinner: [getDinnerFallback(), getDinnerFallback()]
        }));

        return { weeklyPlan: fallbackWeeklyPlan };
    }
}

// 3. 换单道菜
export async function generateSingleReplacementDish(mealType, excludeName) {
    const config = getAppConfig();
    if (!config.geminiApiKey) {
        throw new Error('请先设置 Gemini API Key！');
    }

    const mealLabel = mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐（4岁小朋友学校便当/零食，2-3种免加热食材）' : '晚餐';
    const prompt = `请推荐一道适合${mealLabel}的美味菜品，菜名绝对不能是 "${excludeName}"。
请严格返回合法的 JSON 格式（不要包含任何 markdown 代码块标记）：
{
  "dish_name": "新菜名",
  "mealType": "${mealType}",
  "ingredients": ["主料1", "主料2"],
  "steps": "详细的烹饪/准备步骤说明..."
}`;

    try {
        const response = await fetch(`${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${config.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) throw new Error('Gemini 未返回有效内容');

        return cleanAndParseJSON(candidateText);
    } catch (err) {
        console.warn("AI 换菜遇到高负载，启用兜底:", err.message);
        
        if (mealType === 'lunch') {
            return {
                dish_name: "趣味水果便当",
                mealType: "lunch",
                ingredients: ["奶酪片", "蓝莓", "小饼干"],
                steps: "装入便当盒，方便小朋友课间食用。"
            };
        }

        const favorites = getFavoritesList();
        const availableFavs = favorites.filter(fav => fav.dish_name !== excludeName);
        if (availableFavs.length > 0) {
            const randomFav = availableFavs[Math.floor(Math.random() * availableFavs.length)];
            return {
                dish_name: randomFav.dish_name,
                mealType: mealType,
                ingredients: randomFav.ingredients || ["精选食材"],
                steps: randomFav.steps || "按个人喜好烹饪即可。"
            };
        }

        return {
            dish_name: "葱花炒鸡蛋",
            mealType: mealType,
            ingredients: ["鸡蛋", "葱花", "食用油", "盐"],
            steps: "1. 鸡蛋打散；2. 热锅下油翻炒出锅。"
        };
    }
}

export async function scanImageForRecipe(base64Image) {
    const config = getAppConfig();
    const apiKey = config.geminiApiKey || localStorage.getItem('soussnap_gemini_key');
    if (!apiKey) throw new Error("未找到 API Key");

    const prompt = `请识别这张图片中的食材或小票，并以合法的 JSON 数组格式返回识别到的食材列表（不要包含任何 markdown 代码块标记，如 \`\`\`json）：
    [
      { "name": "食材名称1", "category": "vegetable", "expiry": "2026-12-31" }
    ]`;

    const response = await fetch(`${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }]
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(`[Gemini API Error]: ${data.error.message}`);

    const text = data.candidates[0].content.parts[0].text;
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
}
