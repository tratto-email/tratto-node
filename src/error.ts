export class TrattoError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly docs?: string,
  ) {
    super(message);
    this.name = 'TrattoError';
  }
}
