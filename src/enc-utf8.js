/*
 ES6 compatible port of CryptoJS - encoding

 Source: https://github.com/brix/crypto-js
 LICENSE: MIT
 */
const enc = {
  Latin1: {
    stringify: (wordArray) => {
      // Shortcuts
      let words = wordArray.words;
      let sigBytes = wordArray.sigBytes;
      let latin1Chars = [],
        i,
        bite;

      // Convert
      for (i = 0; i < sigBytes; i++) {
        bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        latin1Chars.push(String.fromCharCode(bite));
      }

      return latin1Chars.join('');
    },
  },

  _Utf8: {
    stringify: (wordArray) => {
      try {
        const Decoder =
          typeof TextDecoder !== 'undefined'
            ? TextDecoder
            : typeof globalThis !== 'undefined' && globalThis.TextDecoder
              ? globalThis.TextDecoder
              : undefined;
        if (Decoder) {
          const sigBytes = wordArray.sigBytes;
          const words = wordArray.words;
          const bytes = new Uint8Array(sigBytes);
          for (let i = 0; i < sigBytes; i++) {
            bytes[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
          }
          return new Decoder('utf-8', { fatal: true }).decode(bytes);
        }
        return decodeURIComponent(escape(enc.Latin1.stringify(wordArray)));
      } catch (err) {
        throw new Error('Malformed UTF-8 data', err);
      }
    },
  },
};

export default enc;
