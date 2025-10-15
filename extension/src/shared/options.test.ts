import { describe, it, expect } from 'vitest';
import { normalizeOptions } from './options';

describe('normalizeOptions', () => {
    it('clamps threshold and coerces types', () => {
        const o = normalizeOptions({ threshold: 2, sleep: '1', domainBoost: '3', stopwords: [' A ', 'b'] });
        expect(o.threshold).toBe(1);
        expect(o.sleep).toBe(true);
        expect(o.domainBoost).toBe(3);
        expect(o.stopwords).toEqual(['a', 'b']);
    });

    it('defaults when invalid', () => {
        const o = normalizeOptions({ threshold: 'x', domainBoost: 0, stopwords: 'no' });
        expect(o.threshold).toBe(0.5);
        expect(o.domainBoost).toBe(1);
        expect(o.stopwords).toEqual([]);
    });
});

