import { describe, expect, it } from 'vitest';
import { erVagtMail, TEST_EMNE } from './mailvagt';

describe('erVagtMail', () => {
  it('kender vagtens emne, også efter videresendelse', () => {
    expect(erVagtMail(`${TEST_EMNE} fwd abc123`)).toBe(true);
    expect(erVagtMail(`Fwd: ${TEST_EMNE} direkte abc123`)).toBe(true);
    expect(erVagtMail('SV: [MAILVAGT] ud x1y2z3')).toBe(true);
  });
  it('lader kundemails være i fred', () => {
    expect(erVagtMail('Din lejlighed på Svendborgvej 13')).toBe(false);
    expect(erVagtMail('')).toBe(false);
    expect(erVagtMail(null)).toBe(false);
  });
});
