export class PaginationCallbackData {
  constructor(
    public readonly entity: string,
    public readonly action: string,
    public readonly page: number,
    public readonly extra?: string
  ) {}

  static fromString(data: string): PaginationCallbackData {
    const [entity, action, pageStr, ...extraParts] = data.split(':');
    const page = parseInt(pageStr, 10);
    const extra = extraParts.length > 0 ? extraParts.join(':') : undefined;
    
    return new PaginationCallbackData(entity, action, page, extra);
  }

  toString(): string {
    const base = `${this.entity}:${this.action}:${this.page}`;
    return this.extra ? `${base}:${this.extra}` : base;
  }
}
