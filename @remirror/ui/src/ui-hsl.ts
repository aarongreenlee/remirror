/* eslint-disable @typescript-eslint/restrict-plus-operands */

import {
  bool,
  clamp,
  isArray,
  isNumber,
  isObject,
  isPlainObject,
  isString,
  isUndefined,
} from '@remirror/core-helpers';
import { Brand } from '@remirror/core-types';

interface HueBrand {
  readonly Hue: unique symbol;
}
interface PercentBrand {
  readonly Percent: unique symbol;
}

type Hue = Brand<number, HueBrand>;
type Percent = Brand<number, PercentBrand>;
type Alpha = Percent;

interface BrandedHSLObject {
  h: Hue;
  s: Percent;
  l: Percent;
  a: Alpha;
}

export interface ValidHSLObject {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export type ValidHSLTuple = [number, number, number, number?];

export interface NamedHSLObject {
  hue: number | string;
  saturation: number | string;
  lightness: number | string;
  alpha?: number | string;
}
export interface HSLObject {
  h: number | string;
  s: number | string;
  l: number | string;
  a?: number | string;
}

export type HSLTuple = [number | string, number | string, number | string, (number | string)?];

export type HSLCreateParams = HSL | HSLObject | NamedHSLObject | HSLTuple | string;

// Taken from https://github.com/regexhq/hsla-regex/blob/master/test/test.js#L7
const HSLA_REGEX = /^hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*(\d*(?:\.\d+)?)\)$/;

// Taken from https://github.com/regexhq/hsl-regex/blob/3ea5cede63c1e4a30878e7329a197c502337b7b3/index.js#L7
const HSL_REGEX = /^hsl\(\s*([\d.]+)\s*,\s*(\d*(?:\.\d+)?%)\s*,\s*(\d*(?:\.\d+)?%)\)$/;

const HSL_SYMBOL = Symbol.for('hslColor');

export const isHSL = (value: unknown): value is HSL =>
  isObject(value) && value.constructor && (value.constructor as any).$$id === HSL_SYMBOL;

const isNamedHSLObject = (value: unknown): value is NamedHSLObject =>
  bool(isPlainObject(value) && value.hue && value.saturation && value.lightness);

const isHSLObject = (value: unknown): value is HSLObject =>
  bool(isPlainObject(value) && value.h && value.s && value.l);

const hslArrayToObject = (value: any[]): HSLObject => {
  const [h, s, l, a] = value;
  return { h, s, l, a };
};

const hslStringToObject = (value: string): HSLObject => {
  const regexValue = HSLA_REGEX.exec(value) || HSL_REGEX.exec(value);

  if (!regexValue) {
    throw new Error(`Invalid HSL input string used: '${value}'`);
  }

  const [, ...array] = regexValue;

  return hslArrayToObject(array);
};

const convertHSLToObject = (value: HSLObject | NamedHSLObject | HSLTuple | string): HSLObject => {
  if (isHSLObject(value)) {
    return value;
  }

  if (isNamedHSLObject(value)) {
    const { hue: h, saturation: s, lightness: l, alpha: a } = value;
    return { h, s, l, a };
  }

  if (isArray(value)) {
    return hslArrayToObject(value);
  }

  if (isString(value)) {
    return hslStringToObject(value);
  }

  throw new Error(`Invalid HSL input value passed: ${isPlainObject(value) ? JSON.stringify(value) : value}`);
};

const isValidHue = (hue: unknown): hue is Hue => isNumber(hue) && hue <= 360 && hue >= 0;
const createValidHue = (value: number | string) => {
  const hue = isString(value) ? Number(value) % 360 : value % 360;

  if (!isValidHue(hue)) {
    throw new Error(`Invalid 'hue': ${value}`);
  }

  return hue;
};

const isValidPercent = (percent: unknown): percent is Percent =>
  isNumber(percent) && percent <= 100 && percent >= 0;

const createValidPercent = (value: number | string) => {
  const percent = isString(value) ? Number(value.replace(/[%\s]+/g, '')) : value;

  if (!isValidPercent(percent)) {
    throw new Error(`Invalid 'percentage': ${value}`);
  }

  return percent;
};

const clampPercent = (value: number) => clamp({ min: 0, max: 100, value });

const createValidAlpha = (value: number | string | undefined): Alpha => {
  const alpha = isString(value)
    ? value.includes('%')
      ? Number(value.replace(/[%\s]+/g, ''))
      : Number(value) * 100
    : value;

  if (isUndefined(alpha)) {
    return createValidPercent(100);
  }

  return createValidPercent(alpha);
};

/**
 * Create a valid hsl object with numbers as value. Throws an error if
 */
const createValidHSLObject = ({
  h: hue,
  s: saturation,
  l: lightness,
  a: alpha,
}: HSLObject): BrandedHSLObject => ({
  h: createValidHue(hue),
  s: createValidPercent(saturation),
  l: createValidPercent(lightness),
  a: createValidAlpha(alpha),
});

const freeze = (hslObject: BrandedHSLObject): Readonly<BrandedHSLObject> => Object.freeze(hslObject);

/**
 * Taken from https://github.com/usemeta/hsl-rgb/blob/1afed9a9703816e375839b4fbb6458f2765a76a8/index.js#L1
 */
const calculateHue = (pp: number, qq: number, hh: number) => {
  hh = hh < 0 ? hh + 1 : hh > 1 ? hh - 1 : hh;
  return hh < 1 / 6
    ? pp + (qq - pp) * 6 * hh
    : hh < 1 / 2
    ? qq
    : hh < 2 / 3
    ? pp + (qq - pp) * (2 / 3 - hh) * 6
    : pp;
};

/**
 * Taken from https://github.com/usemeta/hsl-rgb/blob/1afed9a9703816e375839b4fbb6458f2765a76a8/index.js#L1
 */
const hslToRgb = ([hue, saturation, lightness]: [number, number, number]): [number, number, number] => {
  let [rr, gg, bb] = [0, 0, 0];
  const hh = hue / 360;
  const ss = saturation / 100;
  const ll = lightness / 100;

  if (ss === 0) {
    rr = gg = bb = ll;
  } else {
    const qq = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const pp = 2 * ll - qq;

    rr = calculateHue(pp, qq, hh + 1 / 3);
    gg = calculateHue(pp, qq, hh);
    bb = calculateHue(pp, qq, hh - 1 / 3);
  }

  return [
    Math.max(0, Math.min(Math.round(rr * 255), 255)),
    Math.max(0, Math.min(Math.round(gg * 255), 255)),
    Math.max(0, Math.min(Math.round(bb * 255), 255)),
  ];
};

/**
 * Convert a percentage to a ratio while avoid
 */
const percentageToRatio = (percent: number, precision = 10) => Number((percent / 100).toFixed(precision));

/**
 * HSLColor is a small utility for transforming colors, but only hsl colors.
 */
export class HSL {
  public static $$id = HSL_SYMBOL;

  /**
   * Create a hsl class from the passed in string / array / object parameters.
   *
   * Throws a descriptive error if invalid parameters are passed in.
   */
  public static create(value: HSLCreateParams): HSL {
    if (isHSL(value)) {
      return value.clone();
    }

    const hsl = createValidHSLObject(convertHSLToObject(value));
    return new HSL(hsl);
  }

  /**
   * Store the hue as an object of number values. Percentages are stored as decimals
   * between 0 and 1.
   */
  private readonly hsla: Readonly<BrandedHSLObject>;

  private constructor(hsla: BrandedHSLObject) {
    this.hsla = freeze(hsla);
  }

  /**
   * Hue
   *
   * A value between 0 and 360 representing the color wheel rotation.
   */
  get h(): number {
    return this.hsla.h;
  }

  /**
   * Saturation
   *
   * A value between 0 and 100 representing the percentage saturation.
   */
  get s(): number {
    return this.hsla.s;
  }

  /**
   * Lightness
   *
   * A value between 0 and 100 representing the percentage lightness.
   */
  get l(): number {
    return this.hsla.l;
  }

  /**
   * Alpha
   *
   * The alpha value which is a number between 0 and 1.
   */
  get a(): number {
    return this.hsla.a;
  }

  /**
   * Brightness
   *
   * Returns a number between 0 and 255 the current color (not taking into account the alpha level).
   * The higher the number the brighter the color.
   *
   * https://24ways.org/2010/calculating-color-contrast
   */
  get brightness(): number {
    const [r, g, b] = this.toRGB();
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  get isDark() {
    return this.brightness < 128;
  }

  get isLight() {
    return !this.isDark;
  }

  /**
   * Returns the object representation of the hsl class.
   */
  public toJSON() {
    const { h, s, l, a } = this;
    return { h, s, l, a };
  }

  /**
   * Return the array representation of the hsl
   */
  public toArray() {
    const { h, s, l, a } = this;
    return [h, s, l, a] as const;
  }

  /**
   * Produces a valid HSL string that can be used to represent a color in your css.
   */
  public toString() {
    const { h, s, l, a } = this;
    const [hue, saturation, lightness, alpha] = [h.toString(), `${s}%`, `${l}%`, `${percentageToRatio(a)}`];

    return alpha === '1'
      ? `hsl(${hue}, ${saturation}, ${lightness})`
      : `hsla(${hue}, ${saturation}, ${lightness}, ${alpha})`;
  }

  /**
   * Returns the array
   */
  public toRGB(): [number, number, number, number?] {
    const { h, s, l, a } = this;
    const [r, g, b] = hslToRgb([h, s, l]);
    return [r, g, b, a];
  }

  /**
   * Rotate the color around the color wheel. The value is always clamped between 0 and 360deg.
   *
   * ```ts
   * const hsl = HSL.create('hsl(180, 50%, 50%)')
   * color.rotate(100).h // => 280
   * ```
   */
  public rotate(degrees: number): HSL {
    const { h, ...sla } = this.hsla;
    return this.clone({ ...sla, h: createValidHue(h + degrees) });
  }

  /**
   * Lighten the color.
   *
   * Can either be a number or a string which represents a percentage.
   *
   * ```ts
   * const hsl = HSL.create('hsl(180, 50%, 50%)')
   * color.lighten(50).l // => 75
   * color.lighten('25%').l // => 62.5
   * ```
   */
  public lighten(percent: number | string): HSL {
    const { l, ...hsa } = this.hsla;
    const lightness = createValidPercent(clampPercent(l + createValidPercent(percent)));
    return this.clone({ ...hsa, l: lightness });
  }

  /**
   * Darken the color.
   *
   * Can either be a number or a string which represents a percentage.
   *
   * ```ts
   * const hsl = HSL.create('hsl(180, 50%, 50%)')
   * color.darken(50).l // => 25
   * color.darken('25%').l // => 37.5
   * ```
   */
  public darken(percent: number | string): HSL {
    const { l, ...hsa } = this.hsla;
    const lightness = createValidPercent(clampPercent(l - createValidPercent(percent)));
    return this.clone({ ...hsa, l: lightness });
  }

  /**
   * Increase the opacity of the color.
   *
   * Can either be a number or a string which represents a percentage.
   *
   * ```ts
   * const hsl = HSL.create('hsla(180, 50%, 50%, 0.5)')
   * color.unfade(40).a // => 90
   * color.unfade('25%').a // => 75
   * ```
   */
  public unfade(percent: number | string): HSL {
    const { a = 100, ...hsl } = this.hsla;
    const alpha = createValidPercent(clampPercent(a + createValidPercent(percent)));
    return this.clone({ ...hsl, a: alpha });
  }

  /**
   * Decrease the opacity of the color.
   *
   * Can either be a number or a string which represents a percentage.
   *
   * ```ts
   * const hsl = HSL.create('hsla(180, 50%, 50%, 0.5)')
   * color.fade(40).a // => 10
   * color.fade('25%').a // => 25
   * ```
   */
  public fade(percent: number | string): HSL {
    const { a = 100, ...hsl } = this.hsla;
    const num = clampPercent(a - createValidPercent(percent));
    const alpha = createValidPercent(num);
    return this.clone({ ...hsl, a: alpha });
  }

  /**
   * Increase the color saturation.
   *
   * Can either be a number or a string which represents a percentage.
   *
   * NOTE: the number is treated as a percentage value (not a ratio).
   * - `50` is treated as `50%`
   * - `0.5` is treated as `0.5%`
   *
   * ```ts
   * const hsl = HSL.create('hsl(180, 50%, 50%)')
   * hsl.saturate(50).s // => 75
   * hsl.saturate('100%').s // => 100
   * ```
   */
  public saturate(percent: number | string): HSL {
    const { s, ...hla } = this.hsla;
    const saturation = createValidPercent(clampPercent(s + createValidPercent(percent)));
    return this.clone({ ...hla, s: saturation });
  }

  /**
   * Decrease the color saturation.
   *
   * Can either be a number or a string which represents a percentage.
   *
   * ```ts
   * const hsl = HSL.create('hsl(180, 50%, 50%)')
   * hsl.desaturate(50).s // => 25
   * hsl.desaturate('100%').s // => 0
   * ```
   */
  public desaturate(percent: number | string): HSL {
    const { s, ...hla } = this.hsla;
    const saturation = createValidPercent(clampPercent(s - createValidPercent(percent)));
    return this.clone({ ...hla, s: saturation });
  }

  /**
   * Set the hue value of the color.
   *
   * ```ts
   * const hsl = HSL.create('hsl(180, 50%, 50%)');
   * hsl.hue(100).h //=> 100
   * ```
   */
  public hue(hue: number | string): HSL {
    return this.clone({ ...this.hsla, h: createValidHue(hue) });
  }

  /**
   * Set the saturation value of the color.
   *
   * ```ts
   * const hsl = HSL.create('hsl(180, 50%, 50%)');
   * hsl.saturation(15).s //=> 15
   * ```
   */
  public saturation(saturation: number | string): HSL {
    return this.clone({ ...this.hsla, s: createValidPercent(saturation) });
  }

  /**
   * Set the lightness value of the color.
   *
   * ```ts
   * const hsl = HSL.create('hsl(180, 50%, 50%)');
   * hsl.lightness(100).h //=> 100
   * ```
   */
  public lightness(lightness: number | string): HSL {
    return this.clone({ ...this.hsla, l: createValidPercent(lightness) });
  }

  /**
   * Set the alpha (transparency) value of the color.
   *
   * Value passed must be a percentage;
   *
   * ```ts
   * const hsl = HSL.create('hsl(180, 50%, 50%, 0.5)');
   * hsl.alpha(40).a // => 40
   * ```
   */
  public alpha(alpha?: number | string): HSL {
    return this.clone({ ...this.hsla, a: createValidAlpha(isNumber(alpha) ? `${alpha}%` : alpha) });
  }

  /**
   * Returns a cloned version of the HSL.
   *
   * If an HSLObject is provided it merges these properties into the final object.
   */
  public clone(hsla: Partial<HSLObject> = Object.create(null)) {
    return new HSL(createValidHSLObject({ ...this.hsla, ...hsla }));
  }

  /* Color Harmonies
  Docs taken from https://www.tigercolor.com/color-lab/color-theory/color-harmonies.htm */

  /**
   * Colors that are opposite each other on the color wheel are considered to be complementary colors (example: red and green).
   *
   * The high contrast of complementary colors creates a vibrant look especially when used at full saturation. This color scheme must be managed well so it is not jarring.
   * Complementary colors are tricky to use in large doses, but work well when you want something to stand out.
   *
   * In general, complementary colors are really bad for text.
   */
  public complement(): HSL {
    return this.rotate(180);
  }

  /**
   * Analogous color schemes use colors that are next to each other on the color wheel.
   * They usually match well and create serene and comfortable designs.
   *
   * Analogous color schemes are often found in nature and are harmonious and pleasing to the eye.
   * Make sure you have enough contrast when choosing an analogous color scheme.
   *
   * Choose one color to dominate, a second to support. The third color is used (along with black,
   * white or gray) as an accent.
   */
  public analagous(direction: 'forwards' | 'backwards' = 'forwards'): [HSL, HSL, HSL] {
    const [secondary, tertiary] = direction === 'forwards' ? [30, 60] : [-30, -60];
    return [this, this.rotate(secondary), this.rotate(tertiary)];
  }

  /**
   * A triadic color scheme uses colors that are evenly spaced around the color wheel.
   *
   * Triadic color harmonies tend to be quite vibrant, even if you use pale or unsaturated
   * versions of your hues.
   *
   * To use a triadic harmony successfully, the colors should be carefully balanced - let one
   * color dominate and use the two others for accent.
   */
  public triadic(): [HSL, HSL, HSL] {
    return [this, this.rotate(120), this.rotate(240)];
  }

  /**
   * The split complementary color scheme is a variation of the complementary color scheme.
   * In addition to the base color, it uses the two colors adjacent to its complement.
   *
   * This color scheme has the same strong visual contrast as the complementary color scheme,
   * but has less tension.
   *
   * The split-complimentary color scheme is often a good choice for beginners, because it is
   * difficult to mess up.
   */
  public splitComplement(): [HSL, HSL, HSL] {
    return [this, this.rotate(150), this.rotate(210)];
  }

  /**
   * The rectangle or tetradic color scheme uses four colors arranged into two
   * complementary pairs.
   *
   * This rich color scheme offers plenty of possibilities for variation.
   * The tetradic color scheme works best if you let one color be dominant.
   *
   * You should also pay attention to the balance between warm and cool colors
   * in your design.
   *
   * @param spacing - a value between 0 and 180 that separates the edges in degrees around a color wheel.
   */
  public rectangle(spacing = 60): [HSL, HSL, HSL, HSL] {
    spacing = clamp({ min: 0, max: 180, value: spacing });
    return [this, this.rotate(spacing), this.rotate(180), this.rotate(180 + spacing)];
  }

  /**
   * The square color scheme is similar to the rectangle, but with all four colors spaced
   * evenly around the color circle.
   *
   * The square color scheme works best if you let one color be dominant.
   *
   * You should also pay attention to the balance between warm and cool colors in your design.
   */
  public square(): [HSL, HSL, HSL, HSL] {
    return this.rectangle(90);
  }
}
