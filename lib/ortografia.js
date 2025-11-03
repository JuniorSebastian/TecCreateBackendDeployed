const nspell = require('nspell');

let spellCheckerPromise = null;

const loadSpellChecker = () => {
  if (!spellCheckerPromise) {
    spellCheckerPromise = (async () => {
      try {
        const dictionaryModule = await import('dictionary-es');
        const dictionaryExport = dictionaryModule.default || dictionaryModule;

        if (typeof dictionaryExport === 'function') {
          return await new Promise((resolve) => {
            dictionaryExport((err, dict) => {
              if (err) {
                console.warn('No se pudo cargar el diccionario español para corrección ortográfica:', err);
                resolve(null);
                return;
              }

              try {
                resolve(nspell(dict));
              } catch (spellError) {
                console.warn('No se pudo inicializar el corrector ortográfico:', spellError);
                resolve(null);
              }
            });
          });
        }

        if (dictionaryExport && dictionaryExport.aff && dictionaryExport.dic) {
          try {
            return nspell(dictionaryExport);
          } catch (spellError) {
            console.warn('No se pudo inicializar el corrector ortográfico con los datos proporcionados:', spellError);
            return null;
          }
        }

        console.warn('El módulo dictionary-es no expuso un diccionario válido.');
        return null;
      } catch (moduleError) {
        console.warn('No se pudo importar el diccionario español:', moduleError);
        return null;
      }
    })();
  }

  return spellCheckerPromise;
};

const preserveCase = (original, suggestion) => {
  if (!suggestion) return original;

  if (/^[A-ZÁÉÍÓÚÑÜ]+$/.test(original)) {
    return suggestion.toUpperCase();
  }

  if (/^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+$/.test(original)) {
    return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
  }

  return suggestion;
};

const normalizeWhitespace = (text) => text
  .replace(/[ \t]{2,}/g, ' ')
  .replace(/\s+\n/g, '\n')
  .replace(/\n\s+/g, '\n')
  .trim();

const shouldSkipWord = (word) => {
  if (!word) return true;
  if (word.length <= 2) return true;
  if (/\d/.test(word)) return true;
  if (/[_@#\d]/.test(word)) return true;
  if (/^[A-ZÁÉÍÓÚÑÜ]{2,}$/.test(word)) {
    // Acrónimo o sigla.
    return true;
  }
  return false;
};

const corregirTexto = async (texto) => {
  if (!texto || typeof texto !== 'string') {
    return texto;
  }

  const spellChecker = await loadSpellChecker();
  if (!spellChecker) {
    return texto;
  }

  const corrected = texto.replace(/\b([A-Za-zÁÉÍÓÚÑÜáéíóúñü'’]+)\b/g, (match) => {
    const word = match.trim();
    if (shouldSkipWord(word)) {
      return match;
    }

    const lower = word.toLowerCase();
    if (spellChecker.correct(lower)) {
      return match;
    }

    const suggestions = spellChecker.suggest(lower);
    if (!suggestions || !suggestions.length) {
      return match;
    }

    const replacement = preserveCase(word, suggestions[0]);
    return replacement || match;
  });

  return normalizeWhitespace(corrected);
};

const corregirLista = async (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const corrected = await Promise.all(items.map((item) => corregirTexto(item)));
  return corrected
    .map((item) => (typeof item === 'string' ? normalizeWhitespace(item) : ''))
    .filter(Boolean);
};

module.exports = {
  corregirTexto,
  corregirLista,
};
