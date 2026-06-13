import { describe, it, expect } from 'vitest';
import { computeCircleLayout, capDpr, isMobile } from './heroLayout.js';

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
