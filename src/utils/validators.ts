export type ValidationResult =
    | { valid: true }
    | { valid: false; errors: string[] };

export const UPDATABLE_FIELDS = [
    'first_name',
    'last_name',
    'date_birth',
    'address',
    'password',
    'mobile_phone',
    'email'
] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value: unknown): boolean =>
    isNonEmptyString(value) && EMAIL_REGEX.test(value);

const isValidDate = (value: unknown): boolean =>
    isNonEmptyString(value) &&
    DATE_REGEX.test(value) &&
    !isNaN(new Date(value).getTime());

const isValidMobilePhone = (value: unknown): boolean =>
    isNonEmptyString(value) || typeof value === 'number' && Number.isFinite(value);

const asString = (value: unknown): string => String(value ?? '').trim();

const validateCommonFields = (body: Record<string, unknown>, errors: string[]) => {
    const { email, mobile_phone, password } = body;

    if (email !== undefined && !isValidEmail(email)) {
        errors.push('El campo email debe ser un correo electrónico válido.');
    }
    if (mobile_phone !== undefined && !isValidMobilePhone(mobile_phone)) {
        errors.push('El campo mobile_phone es requerido.');
    }
    if (password !== undefined && asString(password).length < 6) {
        errors.push('El campo password debe tener al menos 6 caracteres.');
    }
};

export const validateSignup = (body: Record<string, unknown>): ValidationResult => {
    const required: Array<[string, string]> = [
        ['first_name', 'El campo first_name es requerido.'],
        ['last_name', 'El campo last_name es requerido.'],
        ['date_birth', 'El campo date_birth es requerido.'],
        ['mobile_phone', 'El campo mobile_phone es requerido.'],
        ['email', 'El campo email es requerido.'],
        ['password', 'El campo password es requerido.'],
        ['address', 'El campo address es requerido.']
    ];

    const errors: string[] = [];
    for (const [field, message] of required) {
        const value = body[field];
        if (!isNonEmptyString(value) && !(field === 'mobile_phone' && isValidMobilePhone(value))) {
            errors.push(message);
        }
    }

    if (body.date_birth !== undefined && !isValidDate(body.date_birth)) {
        errors.push('El campo date_birth debe tener el formato YYYY-MM-DD y ser una fecha válida.');
    }

    validateCommonFields(body, errors);

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
};

export const validateLogin = (body: Record<string, unknown>): ValidationResult => {
    const errors: string[] = [];
    const { mobile_phone, password } = body;

    if (mobile_phone === undefined || (!isNonEmptyString(mobile_phone) && !(typeof mobile_phone === 'number'))) {
        errors.push('El campo mobile_phone es requerido.');
    }
    if (!isNonEmptyString(password)) {
        errors.push('El campo password es requerido.');
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
};

export const validateUpdate = (body: Record<string, unknown>): ValidationResult => {
    const errors: string[] = [];

    const hasKnownField = UPDATABLE_FIELDS.some((field) => body[field] !== undefined);
    if (!hasKnownField) {
        errors.push('No se enviaron campos válidos para actualizar.');
    }

    if (body.date_birth !== undefined && !isValidDate(body.date_birth)) {
        errors.push('El campo date_birth debe tener el formato YYYY-MM-DD y ser una fecha válida.');
    }

    validateCommonFields(body, errors);

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
};