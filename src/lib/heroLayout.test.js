import { describe, it, expect } from 'vitest';
import { computeCircleLayout, capDpr, isMobile, computeFieldFraming, FIELD_SCALE, FOCAL_Y } from './heroLayout.js';

describe('computeCircleLayout', () => {
  it('desktop 1440x900: clamped diameter, cropped top/right', () => {
    const { D, cx, cyTop } = computeCircleLayout(1440, 900);
    expect(D).toBeCloseTo(633.6, 1);   // 0.44*1440 within [580,760]
    expect(cx).toBeCloseTo(1224.0, 1); // 1440 + 0.07*1440 - D/2
    expect(cyTop).toBeCloseTo(244.8, 1); // -0.08*900 + D/2
  });

  it('desktop 1920x1080: diameter clamped to 760 max', () => {
    const { D } = computeCircleLayout(1920, 1080);
    expect(D).toBeCloseTo(760, 1); // 0.44*1920=844.8 -> clamp 760
  });

  it('mobile 390x844: 0.80*W diameter, top-cropped', () => {
    const { D, cx, cyTop } = computeCircleLayout(390, 844);
    expect(D).toBeCloseTo(312, 1);    // 0.80*390
    expect(cx).toBeCloseTo(273, 1);   // 390 + 0.10*390 - 156
    expect(cyTop).toBeCloseTo(20.96, 1); // -0.16*844 + 156
  });

  it('small mobile 360x780: 0.76*W diameter', () => {
    const { D } = computeCircleLayout(360, 780);
    expect(D).toBeCloseTo(273.6, 1); // 0.76*360
  });
});

describe('capDpr', () => {
  it('caps at 2 on desktop, 1.5 on mobile, never raises', () => {
    expect(capDpr(3, 1440)).toBe(2);
    expect(capDpr(3, 390)).toBe(1.5);
    expect(capDpr(1, 1440)).toBe(1);
  });
});

describe('isMobile', () => {
  it('boundary at 640', () => {
    expect(isMobile(640)).toBe(true);
    expect(isMobile(641)).toBe(false);
  });
});

describe('computeFieldFraming', () => {
  it('identity at the reference aspect 1.6 (1440x900): m=1, Oy=0', () => {
    const { m, Oy } = computeFieldFraming(1440, 900);
    expect(m).toBeCloseTo(1, 6);
    expect(Oy).toBeCloseTo(0, 6);
  });

  it('identity for any aspect <= 1.6 (portrait 768x1024): no zoom, no crop', () => {
    const { m, Oy } = computeFieldFraming(768, 1024);
    expect(m).toBe(1);
    expect(Oy).toBe(0);
  });

  it('zooms in on wide windows (2560x1080): m = A0/aspect, < 1, Oy > 0', () => {
    const { m, Oy } = computeFieldFraming(2560, 1080);
    expect(m).toBeCloseTo(1.6 / (2560 / 1080), 6); // ≈ 0.675
    expect(m).toBeLessThan(1);
    expect(Oy).toBeGreaterThan(0);
  });

  it("pins the headline field-row across aspects: FOCAL_Y*scale*m + Oy === FOCAL_Y*scale", () => {
    for (const [W, H] of [[1440, 900], [1920, 1080], [2560, 1080], [1512, 712]]) {
      const { m, Oy } = computeFieldFraming(W, H);
      expect(FOCAL_Y * FIELD_SCALE * m + Oy).toBeCloseTo(FOCAL_Y * FIELD_SCALE, 6);
    }
  });

  it('caps the zoom at 1/MAX_ZOOM on extreme ultrawide (3840x1080)', () => {
    const { m } = computeFieldFraming(3840, 1080); // aspect ≈ 3.56 > 2.48 cap threshold
    expect(m).toBeCloseTo(1 / 1.55, 6); // ≈ 0.645 floor
  });

  it('m is monotonic non-increasing as aspect grows', () => {
    const aspects = [1.0, 1.6, 1.78, 2.12, 2.37, 3.0];
    const ms = aspects.map((a) => computeFieldFraming(a * 1000, 1000).m);
    for (let i = 1; i < ms.length; i++) {
      expect(ms[i]).toBeLessThanOrEqual(ms[i - 1] + 1e-9);
    }
  });

  it('FIELD_SCALE is the validated 1.40', () => {
    expect(FIELD_SCALE).toBeCloseTo(1.40, 6);
  });
});
