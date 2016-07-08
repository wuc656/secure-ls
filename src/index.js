import utils from './utils';
import constants from './constants';
import enc from './enc-utf8';

import Base64 from './Base64';
import LZString from 'lz-string/libs/lz-string';
import AES from 'crypto-js/aes';
import DES from 'crypto-js/tripledes';
import Rabbit from 'crypto-js/rabbit';
import RC4 from 'crypto-js/rc4';

export default class Library {
  constructor(config) {
    config = config || {};
    this._name = 'my-library';
    this.utils = utils;
    this.constants = constants;
    this.Base64 = Base64;
    this.LZString = LZString;
    this.AES = AES;
    this.DES = DES;
    this.Rabbit = Rabbit;
    this.RC4 = RC4;
    this.enc = enc;

    this.config = {
      isCompression: true,
      encodingType: constants.EncrytionTypes.BASE64
    };
    this.config.isCompression = typeof config.isCompression !== 'undefined' ?
      config.isCompression :
      true;
    this.config.encodingType = (typeof config.encodingType !== 'undefined' || config.encodingType === '') ?
      config.encodingType :
      constants.EncrytionTypes.BASE64;

    this.ls = localStorage;
    this.init();
  };

  init() {
    this.WarningEnum = this.constants.WarningEnum;
    this.WarningTypes = this.constants.WarningTypes;
    this.EncrytionTypes = this.constants.EncrytionTypes;

    this._isBase64 = this._isBase64EncryptionType();
    this._isAES = this._isAESEncryptionType();
    this._isDES = this._isDESEncryptionType();
    this._isRabbit = this._isRabbitEncryptionType();
    this._isRC4 = this._isRC4EncryptionType();
    this._isCompression = this._isDataCompressionEnabled();

    // fill the already present keys to the list of keys being used by secure-ls
    this.utils.allKeys = this.getAllKeys();
  };

  _isBase64EncryptionType() {
    return Base64 &&
      (typeof this.config.encodingType === 'undefined' ||
      this.config.encodingType === this.constants.EncrytionTypes.BASE64);
  };

  _isAESEncryptionType() {
    return AES &&
      (this.config.encodingType === this.constants.EncrytionTypes.AES);
  };

  _isDESEncryptionType() {
    return DES &&
      (this.config.encodingType === this.constants.EncrytionTypes.DES);
  };

  _isRabbitEncryptionType() {
    return AES &&
      (this.config.encodingType === this.constants.EncrytionTypes.RABBIT);
  };

  _isRC4EncryptionType() {
    return AES &&
      (this.config.encodingType === this.constants.EncrytionTypes.RC4);
  };

  _isDataCompressionEnabled() {
    return this.config.isCompression;
  }

  get(key, isAllKeysData) {
    let decodedData = '',
      jsonData = '',
      deCompressedData,
      bytes,
      data;

    if (!this.utils.is(key)) {
      this.utils.warn(this.WarningEnum.KEY_NOT_PROVIDED);
      return jsonData;
    }

    data = this.getDataFromLocalStorage(key);

    if (!data) {
      return jsonData;
    }

    deCompressedData = data; // saves else
    if (this._isCompression || isAllKeysData) { // meta data always compressed
      deCompressedData = LZString.decompress(data);
    }

    decodedData = deCompressedData; // saves else
    if (this._isBase64 || isAllKeysData) { // meta data always Base64
      decodedData = Base64.decode(deCompressedData);
    } else {
      if (this._isAES) {
        bytes = AES.decrypt(deCompressedData.toString(), this.utils.encryptionSecret);
      } else if (this._isDES) {
        bytes = DES.decrypt(deCompressedData.toString(), this.utils.encryptionSecret);
      } else if (this._isRabbit) {
        bytes = Rabbit.decrypt(deCompressedData.toString(), this.utils.encryptionSecret);
      } else if (this._isRC4) {
        bytes = RC4.decrypt(deCompressedData.toString(), this.utils.encryptionSecret);
      }

      if (bytes) {
        decodedData = bytes.toString(enc._Utf8);
      }
    }

    try {
      jsonData = JSON.parse(decodedData);
    } catch (e) {
      throw new Error('Could not parse JSON');
    }

    return jsonData;
  };

  getDataFromLocalStorage(key) {
    return this.ls.getItem(key, true);
  };

  getAllKeys() {
    let data = this.get(this.utils.prefix, true);

    return data.keys || [];
  };

  set(key, data) {
    let dataToStore = '';

    if (!this.utils.is(key)) {
      this.utils.warn(this.WarningEnum.KEY_NOT_PROVIDED);
      return;
    }
    // add key(s) to Array if not already added, only for keys other than meta key
    if (!(String(key) === String(this.utils.prefix))) {
      if (!this.utils.isKeyPresent(key)) {
        this.utils.addToKeysList(key);
        this.setMetaData();
      }
    }

    dataToStore = this.processData(data);
    // Store the data to localStorage
    this.setDataToLocalStorage(key, dataToStore);
  };

  setDataToLocalStorage(key, data) {
    this.ls.setItem(key, data);
  };

  remove(key) {
    if (!this.utils.is(key)) {
      this.utils.warn(this.WarningEnum.KEY_NOT_PROVIDED);
      return;
    }

    if (key === this.utils.prefix && this.getAllKeys().length) {
      this.utils.warn(this.WarningEnum.META_KEY_REMOVE);
      return;
    }

    if (this.utils.isKeyPresent(key)) {
      this.utils.removeFromKeysList(key);
      this.setMetaData();
    }
    this.ls.removeItem(key);
  };

  removeAll() {
    let keys, i;

    keys = this.getAllKeys();
    for (i = 0; i < keys.length; i++) {
      this.ls.removeItem(keys[i]);
    }
    this.ls.removeItem(this.utils.prefix);

    this.utils.allKeys = [];
  };

  clear() {
    this.ls.clear();
    this.utils.allKeys = [];
  };

  processData(data, isAllKeysData) {
    if (!data) {
      return '';
    }

    let jsonData, encodedData, compressedData;

    try {
      jsonData = JSON.stringify(data);
    } catch (e) {
      throw new Error('Could not stringify data.');
    }

    // Encode Based on encoding type
    // If not set, default to Base64 for securing data
    encodedData = jsonData;
    if (this._isBase64 || isAllKeysData) {
      encodedData = Base64.encode(jsonData);
    } else {
      if (this._isAES) {
        encodedData = AES.encrypt(jsonData, this.utils.encryptionSecret);
      } else if (this._isDES) {
        encodedData = DES.encrypt(jsonData, this.utils.encryptionSecret);
      } else if (this._isRabbit) {
        encodedData = Rabbit.encrypt(jsonData, this.utils.encryptionSecret);
      } else if (this._isRC4) {
        encodedData = RC4.encrypt(jsonData, this.utils.encryptionSecret);
      }

      encodedData = encodedData && encodedData.toString();
    }

    // Compress data if set to true
    compressedData = encodedData;
    if (this._isCompression || isAllKeysData) {
      compressedData = LZString.compress(encodedData);
    }

    return compressedData;
  };

  setMetaData() {
    let dataToStore = this.processData({keys: this.utils.allKeys}, true);

    // Store the data to localStorage
    this.setDataToLocalStorage(this.utils.prefix, dataToStore);
  };

  getMetaData() {
    this.get(this.utils.prefix);
  };

};