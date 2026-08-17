import { jest } from '@jest/globals';

function createDeferred() {
  let resolveDeferred;
  const promise = new Promise((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}

describe('waitForPendingPublishes', () => {
  let connectDeferred;
  let fakeChannel;

  beforeEach(() => {
    jest.resetModules();
    connectDeferred = createDeferred();
    fakeChannel = {
      publish: jest.fn(),
      assertExchange: jest.fn().mockResolvedValue(undefined),
    };

    jest.unstable_mockModule('amqplib', () => ({
      default: {
        connect: jest.fn(() => connectDeferred.promise),
      },
    }));
  });

  it('resolves only after all in-flight publishes have settled', async () => {
    const { publish, waitForPendingPublishes } = await import('../../src/lib/rabbitmq.js');

    // Kick off a publish whose underlying connection never resolves until we say so.
    publish('facility.created.test', { foo: 'bar' });

    let settled = false;
    const waitPromise = waitForPendingPublishes().then(() => {
      settled = true;
    });

    // Give pending microtasks a chance to run; the publish is still stuck on connect().
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);

    // Now let the connection resolve so the publish can complete.
    connectDeferred.resolve({
      on: jest.fn(),
      createChannel: jest.fn().mockResolvedValue(fakeChannel),
      close: jest.fn().mockResolvedValue(undefined),
    });

    await waitPromise;
    expect(settled).toBe(true);
    expect(fakeChannel.publish).toHaveBeenCalledTimes(1);
  });

  it('resolves immediately when there are no pending publishes', async () => {
    const { waitForPendingPublishes } = await import('../../src/lib/rabbitmq.js');

    await expect(waitForPendingPublishes()).resolves.toBeUndefined();
  });
});
