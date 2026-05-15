const BASE64_KEY_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const Base64 = {
  _keyStr: BASE64_KEY_STR,
  encode: function (e) {
    const keyStr = this._keyStr;
    const output = [];
    let n, r, i, s, o, u, a;
    let f = 0;
    let outputIndex = 0;

    e = Base64._utf8Encode(e);

    if (keyStr === BASE64_KEY_STR && typeof btoa === 'function') {
      return btoa(e);
    }

    while (f < e.length) {
      n = e.charCodeAt(f++);
      r = e.charCodeAt(f++);
      i = e.charCodeAt(f++);
      s = n >> 2;
      o = ((n & 3) << 4) | (r >> 4);
      u = ((r & 15) << 2) | (i >> 6);
      a = i & 63;
      if (isNaN(r)) {
        u = a = 64;
      } else if (isNaN(i)) {
        a = 64;
      }
      output[outputIndex++] = keyStr.charAt(s) + keyStr.charAt(o) + keyStr.charAt(u) + keyStr.charAt(a);
    }
    return output.join('');
  },
  decode: function (e) {
    const keyStr = this._keyStr;
    const output = [];
    let n, r, i;
    let s, o, u, a;
    let f = 0;
    let outputIndex = 0;

    e = e.replace(/[^A-Za-z0-9+/=]/g, '');

    if (keyStr === BASE64_KEY_STR && typeof atob === 'function' && BASE64_PATTERN.test(e)) {
      return Base64._utf8Decode(atob(e));
    }

    while (f < e.length) {
      s = keyStr.indexOf(e.charAt(f++));
      o = keyStr.indexOf(e.charAt(f++));
      u = keyStr.indexOf(e.charAt(f++));
      a = keyStr.indexOf(e.charAt(f++));
      n = (s << 2) | (o >> 4);
      r = ((o & 15) << 4) | (u >> 2);
      i = ((u & 3) << 6) | a;
      if (u !== 64) {
        output[outputIndex++] = a !== 64 ? String.fromCharCode(n, r, i) : String.fromCharCode(n, r);
      } else {
        output[outputIndex++] = String.fromCharCode(n);
      }
    }
    return Base64._utf8Decode(output.join(''));
  },
  _utf8Encode: function (e) {
    e = e.replace(/\r\n/g, '\n');
    const output = [];
    let outputIndex = 0;

    for (let n = 0; n < e.length; n++) {
      let r = e.charCodeAt(n);

      if (r < 128) {
        output[outputIndex++] = e.charAt(n);
      } else if (r > 127 && r < 2048) {
        output[outputIndex++] = String.fromCharCode((r >> 6) | 192, (r & 63) | 128);
      } else {
        output[outputIndex++] = String.fromCharCode((r >> 12) | 224, ((r >> 6) & 63) | 128, (r & 63) | 128);
      }
    }
    return output.join('');
  },
  _utf8Decode: function (e) {
    const output = [];
    let n = 0;
    let r, c2, c3;
    let outputIndex = 0;

    // r = c2 = 0;
    while (n < e.length) {
      r = e.charCodeAt(n);
      if (r < 128) {
        output[outputIndex++] = e.charAt(n);
        n++;
      } else if (r > 191 && r < 224) {
        c2 = e.charCodeAt(n + 1);
        output[outputIndex++] = String.fromCharCode(((r & 31) << 6) | (c2 & 63));
        n += 2;
      } else {
        c2 = e.charCodeAt(n + 1);
        c3 = e.charCodeAt(n + 2);
        output[outputIndex++] = String.fromCharCode(((r & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        n += 3;
      }
    }
    return output.join('');
  },
};

export default Base64;
