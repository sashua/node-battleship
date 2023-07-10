const ESC = '\x1b';

const controls = {
  default: 0,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
};

export default new Proxy({} as Record<keyof typeof controls, (...strings: string[]) => string>, {
  get:
    (_, prop) =>
    (...strings: string[]) => {
      const color = controls[prop as keyof typeof controls] ?? controls.default;
      return `${ESC}[${color}m${strings.join(' ')}${ESC}[${controls.default}m`;
    },
});
