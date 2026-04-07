/**
 * Service to handle translations using LibreTranslate or Fallbacks
 */

const LIBRE_TRANSLATE_API = 'https://libretranslate.de/translate'; // Public instance or self-hosted

export const translateText = async (text, targetLang = 'en', sourceLang = 'th') => {
  try {
    const res = await fetch(LIBRE_TRANSLATE_API, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
        api_key: '' // Optional for self-hosted
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error('Translation failed');
    
    const data = await res.json();
    return data.translatedText;
  } catch (error) {
    console.error('LibreTranslate Error:', error);
    return null; // Fallback to manual or standard templates
  }
};

export const autoTranslateNarrative = async (thaiText) => {
  // Simple heuristic or bridge to AI
  return await translateText(thaiText);
};
