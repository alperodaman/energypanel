import { jest } from '@jest/globals';
import { requireEnv } from '../src/requireEnv.js';

describe('requireEnv', () => {
  let exitSpy;
  let errorSpy;
  let originalValues;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    originalValues = { FOO: process.env.FOO, BAR: process.env.BAR };
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    for (const [key, value] of Object.entries(originalValues)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('does not exit when all required variables are present', () => {
    process.env.FOO = 'value';
    process.env.BAR = 'value';

    requireEnv(['FOO', 'BAR']);

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with code 1 and logs a fatal message when a variable is missing', () => {
    delete process.env.FOO;
    process.env.BAR = 'value';

    requireEnv(['FOO', 'BAR']);

    expect(errorSpy).toHaveBeenCalledWith(
      'FATAL: Missing required environment variable: FOO. Service cannot start.',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('reports every missing variable when multiple are absent', () => {
    delete process.env.FOO;
    delete process.env.BAR;

    requireEnv(['FOO', 'BAR']);

    expect(errorSpy).toHaveBeenCalledWith(
      'FATAL: Missing required environment variable: FOO. Service cannot start.',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'FATAL: Missing required environment variable: BAR. Service cannot start.',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
