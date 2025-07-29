import { describe, expect, it } from 'vitest';

describe('main process', () => {
    it('runs in Node', () => {
        expect(process.versions.electron).toBeDefined();
    });
});
