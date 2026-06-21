import { describe, it, expect } from 'vitest';
import { THOUGHTS, CATEGORIES } from './thoughts.js';

describe('THOUGHTS', () => {
  it('has exactly 4 entries', () => {
    expect(THOUGHTS).toHaveLength(4);
  });

  it('every entry has the required fields with correct types', () => {
    for (const t of THOUGHTS) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.title).toBe('string');
      expect(typeof t.category).toBe('string');
      expect(typeof t.date).toBe('string');
      expect(typeof t.readTime).toBe('string');
      expect(typeof t.excerpt).toBe('string');
      expect(typeof t.href).toBe('string');
    }
  });

  it('ids are unique', () => {
    const ids = THOUGHTS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every category is a known category', () => {
    for (const t of THOUGHTS) expect(CATEGORIES).toContain(t.category);
  });

  it('CATEGORIES lists the four category labels', () => {
    expect([...CATEGORIES].sort()).toEqual(['Analysis', 'Perspective', 'Product', 'Strategy']);
  });
});
