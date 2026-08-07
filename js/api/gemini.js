// js/api/gemini.js
import { getAppConfig, getUserPreferences, DEFAULT_PREFERENCES } from '../config.js';

const GEMINI_MODEL = 'gemini-3.6-flash';

async function callGemini(prompt, imageBase64 = null) {
    const config = getAppConfig();
    if (!config.geminiApiKey) {
        throw new Error("请先设置 Gemini API Key！");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const parts = [{ text: prompt }];
    if (imageBase64) {
        parts.push({
            inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
            }
        });
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': config.geminiApiKey
        },
        body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(`[Gemini API Error]: ${data.error.message}`);
    }

    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
        throw new Error("Gemini 未返回有效内容");
    }

    return data.candidates[0].content.parts[0].text;
}

// Helper: Parse JSON safely out of markdown wrappers
function safeParseJSON(rawText) {
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    const match = cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : cleanText);
}

/**
 * Generates full 7-day breakfast, lunch, and dinner plan based on user preferences & pantry
 */
export async function generateWeeklyPlanner(pantryList = []) {
    const prefs = getUserPreferences() || DEFAULT_PREFERENCES;
    const pantryStr = pantryList.length ? pantryList.map(p => p.name).join('、') : '无（基于常规食材）';

    const prompt = `你是一个高级AI厨师助手。请为用户定制【本周7天（周一至周日）的早、午、晚餐规划】。

【用户吃货设定】：
- 忌口/过敏原: ${prefs.dietaryRestrictions || '无'}
- 早餐: ${prefs.bfCuisine} 风格，要求 ${prefs.bfCount} 道菜
- 午餐: ${prefs.lunchCuisine} 风格，要求 ${prefs.lunchCount} 道菜
- 晚餐: ${prefs.dinnerCuisine} 风格，要求 ${prefs.dinnerCount} 道菜
- 优先消耗食材库: [${pantryStr}]

【严格输出格式】：请直接输出 JSON 结构，不要包含任何额外说明，键名如下：
{
  "weeklyPlan": [
    {
      "day": "周一",
      "breakfast": [
        { "dish_name": "菜名", "image_search_kw": "搜索精准图片的关键词如：清蒸鲳鱼", "ingredients": ["食材1"], "steps": "步骤说明..." }
      ],
      "lunch": [
        { "dish_name": "菜名", "image_search_kw": "精准搜索关键词", "ingredients": ["食材1"], "steps": "步骤说明..." }
      ],
      "dinner": [
        { "dish_name": "菜名", "image_search_kw": "精准搜索关键词", "ingredients": ["食材1"], "steps": "步骤说明..." }
      ]
    }
  ]
}`;

    const raw = await callGemini(prompt);
    return safeParseJSON(raw);
}

/**
 * Item 7: “大厨私教” Single dish refinement
 */
export async function refineSingleDish(originalDish, userFeedback) {
    const prompt = `原菜谱：${JSON.stringify(originalDish)}
用户修改要求（大厨私教指导）："${userFeedback}"

请根据要求调整该菜谱，并保持 JSON 格式输出：
{
  "dish_name": "新菜名",
  "image_search_kw": "搜索精准图片的关键词",
  "ingredients": ["食材1", "食材2"],
  "steps": "调整后的步骤..."
}`;

    const raw = await callGemini(prompt);
    return safeParseJSON(raw);
}

/**
 * Scan photo/receipt for pantry
 */
export async function scanImageForIngredients(imageBase64) {
    const prompt = `分析这张小票或照片，识别并提取出所有食品食材名称。严格输出 JSON：{"items": ["食材1", "食材2"]}`;
    const raw = await callGemini(prompt, imageBase64);
    return safeParseJSON(raw);
}
