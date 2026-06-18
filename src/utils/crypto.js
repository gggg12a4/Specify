import CryptoJS from 'crypto-js';

// 配置文件中提供的 AES 密钥和 IV (前后端必须一致，16位字符)
const AES_KEY = CryptoJS.enc.Utf8.parse('1234567890adbcde');
const AES_IV = CryptoJS.enc.Utf8.parse('1234567890hjlkew');

/**
 * 使用 AES 加密敏感操作密码
 * @param {string} password - 用户输入的明文密码
 * @returns {string} - Base64 或 Hex 格式的加密字符串（这里默认使用 Base64，与后端约定一致）
 */
export const encryptPassword = (password) => {
  if (!password) return '';

  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(password), AES_KEY, {
    iv: AES_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString(); // 默认返回 Base64 字符串
};
