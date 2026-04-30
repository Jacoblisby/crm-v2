/**
 * SLA-tests. Forretningskritisk logik — alle bug-rapporter mod CRM'en
 * starter typisk med "hvorfor er dette lead i SLA-brud?".
 */
import { describe, it, expect } from 'vitest';
import { computeSLA } from './sla';

const NOW = new Date('2026-04-30T12:00:00Z');

const stage = (slaDays: number | null, isTerminal = false) => ({ slaDays, isTerminal });

describe('computeSLA', () => {
  it('returns ok for terminal stage regardless of age', () => {
    const result = computeSLA({
      stageChangedAt: '2024-01-01T00:00:00Z',
      stage: stage(null, true),
      now: NOW,
    });
    expect(result.status).toBe('ok');
  });

  it('returns ok for stage with null sla_days', () => {
    const result = computeSLA({
      stageChangedAt: '2024-01-01T00:00:00Z',
      stage: stage(null, false),
      now: NOW,
    });
    expect(result.status).toBe('ok');
    expect(result.slaDays).toBe(null);
  });

  it('returns ok when within first half of SLA window', () => {
    // SLA = 7 dage, lead 2 dage gammel → 2/7 = 28% → ok
    const result = computeSLA({
      stageChangedAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000),
      stage: stage(7),
      now: NOW,
    });
    expect(result.status).toBe('ok');
    expect(result.daysInStage).toBeCloseTo(2, 1);
  });

  it('returns warning when in second half but under SLA', () => {
    // SLA = 7 dage, lead 5 dage gammel → 5/7 = 71% → warning (>50%)
    const result = computeSLA({
      stageChangedAt: new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000),
      stage: stage(7),
      now: NOW,
    });
    expect(result.status).toBe('warning');
  });

  it('returns breach when over SLA', () => {
    // SLA = 7 dage, lead 8 dage gammel → breach
    const result = computeSLA({
      stageChangedAt: new Date(NOW.getTime() - 8 * 24 * 60 * 60 * 1000),
      stage: stage(7),
      now: NOW,
    });
    expect(result.status).toBe('breach');
  });

  it('boundary: exactly at SLA-threshold = warning, not breach', () => {
    // 7.0 dage præcis — > 50% er sandt, > 100% er falsk
    const result = computeSLA({
      stageChangedAt: new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000),
      stage: stage(7),
      now: NOW,
    });
    expect(result.status).toBe('warning');
  });

  it('boundary: just over SLA = breach', () => {
    const result = computeSLA({
      stageChangedAt: new Date(NOW.getTime() - 7.001 * 24 * 60 * 60 * 1000),
      stage: stage(7),
      now: NOW,
    });
    expect(result.status).toBe('breach');
  });

  it('boundary: exactly at half SLA = ok, not warning', () => {
    // 3.5 dage præcis ud af 7 — > 50% er falsk (3.5 er IKKE > 3.5)
    const result = computeSLA({
      stageChangedAt: new Date(NOW.getTime() - 3.5 * 24 * 60 * 60 * 1000),
      stage: stage(7),
      now: NOW,
    });
    expect(result.status).toBe('ok');
  });

  it('handles "Ny lead" SLA = 1 dag correctly (Loveable spec)', () => {
    // 0.6 dage gammel, SLA = 1 dag → 60% → warning
    const result = computeSLA({
      stageChangedAt: new Date(NOW.getTime() - 0.6 * 24 * 60 * 60 * 1000),
      stage: stage(1),
      now: NOW,
    });
    expect(result.status).toBe('warning');
  });

  it('handles "Afventer lejer" SLA = 30 dage (long stage)', () => {
    // 20 dage gammel, SLA = 30 dage → 67% → warning
    const result = computeSLA({
      stageChangedAt: new Date(NOW.getTime() - 20 * 24 * 60 * 60 * 1000),
      stage: stage(30),
      now: NOW,
    });
    expect(result.status).toBe('warning');
  });

  it('accepts stageChangedAt as string', () => {
    const result = computeSLA({
      stageChangedAt: NOW.toISOString(),
      stage: stage(1),
      now: NOW,
    });
    expect(result.daysInStage).toBeCloseTo(0, 5);
  });

  it('accepts stageChangedAt as Date', () => {
    const result = computeSLA({
      stageChangedAt: NOW,
      stage: stage(1),
      now: NOW,
    });
    expect(result.daysInStage).toBeCloseTo(0, 5);
  });
});
