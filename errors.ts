export interface ErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

export class AppError extends Error {}

export function describeError(error: ErrorLike, fallback: string): string {
  if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (error.code === '42501') return 'You do not have permission to do that.';
  if (error.code === '23505') return 'That already exists.';
  if (error.code === 'P0001' && error.message) return error.message;
  if (error.code?.startsWith('23')) return 'Some details are invalid. Please check the form and try again.';
  return fallback;
}

export function throwOnError(error: ErrorLike | null, fallback: string): void {
  if (error) throw new AppError(describeError(error, fallback));
}

export function messageFrom(err: unknown, fallback: string): string {
  return err instanceof AppError ? err.message : fallback;
}
