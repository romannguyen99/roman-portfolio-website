import { describe, it, expect } from 'vitest';
import { WORKS, MOTIFS } from './works.js';

describe('WORKS', () => {
  it('has exactly 4 entries', () => {
    expect(WORKS).toHaveLength(4);
  });

  it('every entry has the required fields with correct types', () => {
    for (const w of WORKS) {
      expect(typeof w.id).toBe('string');
      expect(typeof w.title).toBe('string');
      expect(typeof w.category).toBe('string');
      expect(typeof w.summary).toBe('string');
      expect(Array.isArray(w.tools)).toBe(true);
      expect(w.tools.length).toBeGreaterThan(0);
      expect(typeof w.metric.value).toBe('string');
      expect(typeof w.metric.label).toBe('string');
      expect(typeof w.href).toBe('string');
    }
  });

  it('every motif is one of the valid keys', () => {
    for (const w of WORKS) expect(MOTIFS).toContain(w.motif);
  });

  it('ids are unique', () => {
    const ids = WORKS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('MOTIFS lists the four motif keys', () => {
    expect([...MOTIFS].sort()).toEqual(['churn', 'forecast', 'recsys', 'sentiment']);
  });
});
