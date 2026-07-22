import { CategoryNameSchema } from './models/schemas';

describe('CategoryNameSchema', () => {
  it('validates valid category names', () => {
    const result = CategoryNameSchema.safeParse('Groceries');
    expect(result.success).toBe(true);
  });

  it('rejects empty category names', () => {
    const result = CategoryNameSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});
