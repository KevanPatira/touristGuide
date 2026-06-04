// voiceTranslator/translateText.js
// Isolated translation utility — swap the API provider here without touching any UI component.
//
// Currently uses LibreTranslate (free, no key).
// TODO: Replace with Google Cloud Translation API key for production use.
// TODO: Replace with DeepL API key for higher quality translations.

import { getShortCode } from './translatorConstants';

const LIBRE_TRANSLATE_URL = 'https://libretranslate.de/translate';
// TODO: Replace with Google Cloud Translation API endpoint
// const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
// const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';

/**
 * Translate text from one language to another.
 * @param {string} text — the text to translate
 * @param {string} sourceLang — BCP-47 code (e.g. 'en-US')
 * @param {string} targetLang — BCP-47 code (e.g. 'hi-IN')
 * @returns {Promise<string>} — the translated text
 */
export async function translateText(text, sourceLang, targetLang) {
  const source = getShortCode(sourceLang);
  const target = getShortCode(targetLang);

  // --- LibreTranslate implementation ---
  try {
    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: 'text',
        // TODO: Add API key here when using a keyed instance
        // api_key: ''
      }),
    });

    if (!response.ok) {
      // If LibreTranslate fails, try MyMemory as fallback
      return await fallbackTranslate(text, source, target);
    }

    const data = await response.json();

    if (data.error) {
      return await fallbackTranslate(text, source, target);
    }

    return data.translatedText;
  } catch (error) {
    // Try fallback API
    return await fallbackTranslate(text, source, target);
  }
}

/**
 * Fallback translation using MyMemory API (free, no key, 1000 words/day)
 */
async function fallbackTranslate(text, source, target) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    throw new Error('Translation not available');
  } catch (error) {
    throw new Error('Translation failed. Please try again.');
  }
}
