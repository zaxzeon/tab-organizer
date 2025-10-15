import { describe, it, expect } from 'vitest';
import { tokenize, extractDomain, pickGroupName } from './utils';

describe('utils', () => {
    it('tokenize removes punctuation and stopwords, keeps >2 chars', () => {
        const toks = tokenize('Hello, the quick brown fox!!!');
        expect(toks.includes('hello')).toBe(true);
        expect(toks.includes('the')).toBe(false);
        expect(toks.find(t => t.length <= 2)).toBeUndefined();
    });

    it('extractDomain trims www and parses host', () => {
        expect(extractDomain('https://www.example.com/page')).toBe('example.com');
    });

    it('pickGroupName returns capitalized token + Group', () => {
        const name = pickGroupName(['alpha beta', 'alpha gamma']);
        expect(name.toLowerCase().includes('alpha')).toBe(true);
        expect(name.endsWith(' Group')).toBe(true);
    });
});

