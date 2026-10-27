export class TrattoError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly docs?: string,
    /** Field-level detail of a 422, e.g. `[{ path: '/emails/3/to', message }]`. */
    public readonly details?: unknown[],
    /**
     * What to do next, when the API says it (e.g. wait and retry, or fix a
     * setting). `undefined` when the error carries no suggestion.
     */
    public readonly suggestion?: string,
  ) {
    super(message);
    this.name = 'TrattoError';
  }
}
