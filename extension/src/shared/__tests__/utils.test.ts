import { describe, it, expect } from 'vitest';
import { tokenize, extractDomain, jaccard, pickGroupName } from '../../shared/utils';

describe('utils', () => {
    it('tokenize should lowercase, strip punctuation, drop stopwords and short tokens', () => {
        const out = tokenize('Hello, WORLD!!! this is a Test of tokens');
        // "this" and "is" are stopwords; short tokens removed; punctuation removed
        expect(out).toEqual(['hello', 'world', 'test', 'tokens']);
    });

    it('extractDomain should parse and strip www', () => {
        expect(extractDomain('https://www.example.com/page')).toBe('example.com');
        expect(extractDomain('http://sub.domain.co.uk/path')).toBe('sub.domain.co.uk');
        expect(extractDomain('not a url')).toBe('');
    });

    it('jaccard should compute intersection over union', () => {
        const a = ['a', 'b', 'c'];
        const b = ['b', 'c', 'd'];
        const s = jaccard(a, b);
        expect(s).toBeCloseTo(2 / 4, 6);
    });

    it('pickGroupName chooses most frequent token with formatting', () => {
        const texts = ['Alpha beta', 'alpha beta beta', 'alpha gamma'];
        const name = pickGroupName(texts);
        expect(name).toMatch(/Beta Group|Alpha Group/);
    });
});
