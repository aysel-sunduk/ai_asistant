/**
 * E-posta doğrulama
 */
export function isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Şifre doğrulama – en az 6 karakter
 */
export function isValidPassword(password: string): boolean {
    return password.length >= 6;
}

/**
 * Boş alan kontrolü
 */
export function isNotEmpty(value: string): boolean {
    return value.trim().length > 0;
}

/**
 * Telefon numarası doğrulama (Türkiye)
 */
export function isValidPhone(phone: string): boolean {
    const re = /^(\+90|0)?[5][0-9]{9}$/;
    return re.test(phone.replace(/\s/g, ''));
}

/**
 * Form alanı hata mesajı
 */
export function getFieldError(fieldName: string, value: string): string | null {
    if (!isNotEmpty(value)) return `${fieldName} boş bırakılamaz`;
    return null;
}
