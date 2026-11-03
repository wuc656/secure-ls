import SecureLS from '../src/index';
import utils from '../src/utils';
import CryptoJSWordArray from '../src/WordArray';
import enc from '../src/enc-utf8';

let lib;

describe('Utils tests', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    lib = new SecureLS();
  });

  afterEach(() => {
    console.warn.mockRestore();
    lib.removeAll();
  });

  describe('method: is', () => {
    test('return true if key is present', () => {
      const response = utils.is('new-key');
      expect(response).toBe(true);
    });

    test('return false if key is not present', () => {
      const response = utils.is();
      expect(response).toBe(false);
    });
  });

  describe('method: warn', () => {
    test('warn with default warning msg if no reason provided', () => {
      utils.warn();
      expect(console.warn).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Unexpected output');
    });

    test('warn with undefined warning msg if wrong reason provided', () => {
      utils.warn('wrong');
      expect(console.warn).toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalledWith('Unexpected output');
    });

    test('warn with warning msg as per reason provided', () => {
      utils.warn('keyNotProvided');
      expect(console.warn).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Secure LS: Key not provided. Aborting operation!');
    });
  });

  describe('method: generateSecretKey', () => {
    test('validate PBKDF2 key generated', () => {
      const encryptionKey = utils.generateSecretKey();
      expect(typeof encryptionKey).toBe('string');
      expect(encryptionKey.length).toBeGreaterThan(30);
    });
  });

  describe('method: getObjectFromKey', () => {
    test('if no data provided, return empty object', () => {
      const response = utils.getObjectFromKey();
      expect(response).toEqual({});
    });

    test('if data provided is empty array, return empty object', () => {
      const response = utils.getObjectFromKey([]);
      expect(response).toEqual({});
    });

    test('should return obj matching the key provided', () => {
      const data = [
        { k: 'name', test: 'case1' },
        { k: 'stars', test: 'case2' },
      ];
      const response = utils.getObjectFromKey(data, 'name');
      expect(response).toBe(data[0]);
    });
  });

  describe('method: extractKeyNames', () => {
    test('should return just the `k` values', () => {
      const data = {
        keys: [
          { k: 'name', test: 'case1' },
          { k: 'stars', test: 'case2' },
        ],
      };
      const response = utils.extractKeyNames(data);
      expect(Array.isArray(response)).toBe(true);
      expect(response).toContain('name');
      expect(response).not.toContain('test');
    });
  });

  describe('method: isKeyPresent', () => {
    test('should return the boolean based on key presence', () => {
      const allKeys = [
        { k: 'name', test: 'case1' },
        { k: 'stars', test: 'case2' },
      ];
      expect(utils.isKeyPresent(allKeys, 'name')).toBe(true);
      expect(utils.isKeyPresent(allKeys, 'wrong-key')).toBe(false);
    });
  });

  describe('method: removeFromKeysList', () => {
    test('should remove object from array if key matches', () => {
      const allKeys = [
        { k: 'name', test: 'case1' },
        { k: 'stars', test: 'case2' },
      ];

      expect(allKeys.length).toBe(2);
      utils.removeFromKeysList(allKeys, 'name');
      expect(allKeys.length).toBe(1);
      utils.removeFromKeysList(allKeys, 'wrong-key');
      expect(allKeys.length).toBe(1);
      utils.removeFromKeysList(allKeys, 'stars');
      expect(allKeys.length).toBe(0);
    });
  });

  describe('CryptoJSWordArray random and CSPRNG fallback', () => {
    test('generate random word array with CSPRNG', () => {
      const res = CryptoJSWordArray.random(16);
      expect(res.sigBytes).toBe(16);
      expect(res.words.length).toBe(4);
    });

    test('generate random word array with legacy fallback when crypto.getRandomValues is undefined', () => {
      const originalCrypto = globalThis.crypto;
      try {
        delete globalThis.crypto;
        const res = CryptoJSWordArray.random(16);
        expect(res.sigBytes).toBe(16);
        expect(res.words.length).toBe(4);
      } finally {
        globalThis.crypto = originalCrypto;
      }
    });
  });

  describe('enc._Utf8 stringify', () => {
    test('properly decodes UTF-8 multi-byte characters', () => {
      const testStr = 'Hello 世界 🚀';
      const encoded = Buffer.from(testStr, 'utf-8');
      const words = [];
      for (let i = 0; i < encoded.length; i += 4) {
        let word = 0;
        for (let j = 0; j < 4; j++) {
          if (i + j < encoded.length) {
            word |= encoded[i + j] << (24 - j * 8);
          }
        }
        words.push(word);
      }
      const wordArray = { words, sigBytes: encoded.length };
      expect(enc._Utf8.stringify(wordArray)).toBe(testStr);
    });

    test('throws error on malformed UTF-8 data', () => {
      const wordArray = { words: [0xffffffff], sigBytes: 4 };
      expect(() => enc._Utf8.stringify(wordArray)).toThrow('Malformed UTF-8 data');
    });
  });
});
