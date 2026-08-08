// js/config.js

export const DEFAULT_PREFERENCES = {
    dietaryRestrictions: '',
    bfCuisine: '西式快手',
    bfCount: 1,
    lunchCuisine: '中式家常',
    lunchCount: 2,
    dinnerCuisine: '中式家常',
    dinnerCount: 2
};

export function getAppConfig() {
    return {
        geminiApiKey: localStorage.getItem('soussnap_gemini_key') || '',
        googleApiKey: localStorage.getItem('soussnap_google_key') || '',
        googleCx: localStorage.getItem('soussnap_google_cx') || ''
    };
}

export function saveAppConfig(geminiKey, googleKey, googleCx) {
    localStorage.setItem('soussnap_gemini_key', geminiKey.trim());
    localStorage.setItem('soussnap_google_key', googleKey.trim());
    localStorage.setItem('soussnap_google_cx', googleCx.trim());
}

export function getUserPreferences() {
    const raw = localStorage.getItem('soussnap_user_prefs');
    return raw ? JSON.parse(raw) : null;
}

export function saveUserPreferences(prefs) {
    localStorage.setItem('soussnap_user_prefs', JSON.stringify(prefs));
}
