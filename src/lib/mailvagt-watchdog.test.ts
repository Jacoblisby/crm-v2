import { describe, expect, it } from 'vitest';
import { skalAlarmere } from './mailvagt-watchdog';

const dag = new Date('2026-10-14T10:00:00+02:00');
const nat = new Date('2026-10-14T03:00:00+02:00');

describe('skalAlarmere', () => {
  it('tier om vagten aldrig er startet', () => {
    expect(skalAlarmere({ hjerteslagTimerSiden: null, sidsteAlarmTimerSiden: null, nu: dag })).toBe(false);
  });
  it('tier så længe vagten melder sig', () => {
    expect(skalAlarmere({ hjerteslagTimerSiden: 1.5, sidsteAlarmTimerSiden: null, nu: dag })).toBe(false);
    expect(skalAlarmere({ hjerteslagTimerSiden: 5.9, sidsteAlarmTimerSiden: null, nu: dag })).toBe(false);
  });
  it('alarmerer efter 6 timers tavshed om dagen', () => {
    expect(skalAlarmere({ hjerteslagTimerSiden: 7, sidsteAlarmTimerSiden: null, nu: dag })).toBe(true);
  });
  it('alarmerer ikke om natten', () => {
    expect(skalAlarmere({ hjerteslagTimerSiden: 9, sidsteAlarmTimerSiden: null, nu: nat })).toBe(false);
  });
  it('alarmerer ikke to gange for samme tavshed', () => {
    expect(skalAlarmere({ hjerteslagTimerSiden: 8, sidsteAlarmTimerSiden: 2, nu: dag })).toBe(false);
  });
  it('alarmerer igen efter 12 timer, hvis tavsheden varer', () => {
    expect(skalAlarmere({ hjerteslagTimerSiden: 30, sidsteAlarmTimerSiden: 13, nu: dag })).toBe(true);
  });
});
