// hooks/useTranslation.js
// Custom hook for text translation via REST APIs.
//
// ─── PRIMARY: Google Translate (free, no API key, all language pairs) ───
// ─── FALLBACK: MyMemory (free, no API key, 1000 words/day) ───

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export default function useTranslation() {
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  // AbortController ref for cancelling in-flight requests
  const abortControllerRef = useRef(null);

  const translate = useCallback(async (text, sourceLang, targetLang) => {
    // Skip if text is empty or fewer than 2 characters
    if (!text || text.trim().length < 2) return;

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsTranslating(true);
    setTranslationError(null);

    const trimmed = text.trim();

    try {
      // PRIMARY: Google Translate (free endpoint, supports all language pairs)
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;

      const response = await axios.get(googleUrl, {
        signal: controller.signal,
        timeout: 10000,
      });

      // Google returns a nested array: [[["translated text","original text",null,null,10]],null,"en"]
      const data = response.data;
      let translated = '';

      if (Array.isArray(data) && Array.isArray(data[0])) {
        // Concatenate all translated segments
        translated = data[0]
          .filter((segment) => segment && segment[0])
          .map((segment) => segment[0])
          .join('');
      }

      if (!translated) {
        throw new Error('No translation returned from Google');
      }

      setTranslatedText(translated);
      return translated;

    } catch (err) {
      if (axios.isCancel(err)) return;

      // FALLBACK: MyMemory (free, no API key, 1000 words/day)
      try {
        const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${sourceLang}|${targetLang}&de=tourist@guide.app`;

        const fallbackResponse = await axios.get(myMemoryUrl, {
          signal: controller.signal,
          timeout: 10000,
        });

        const fallbackData = fallbackResponse.data;
        const fallbackText = fallbackData?.responseData?.translatedText;

        if (
          fallbackText &&
          fallbackText.trim().toLowerCase() !== trimmed.toLowerCase()
        ) {
          setTranslatedText(fallbackText);
          return fallbackText;
        } else {
          throw new Error('MyMemory returned untranslated text');
        }
      } catch (fallbackErr) {
        if (axios.isCancel(fallbackErr) || fallbackErr.name === 'AbortError') {
          return;
        }

        if (fallbackErr.code === 'ERR_NETWORK' || fallbackErr.message === 'Network Error') {
          setTranslationError('NETWORK_ERROR');
        } else {
          setTranslationError('TRANSLATION_FAILED');
        }
        setTranslatedText('');
        throw fallbackErr;
      }
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return {
    translatedText,
    isTranslating,
    translationError,
    translate,
  };
}
