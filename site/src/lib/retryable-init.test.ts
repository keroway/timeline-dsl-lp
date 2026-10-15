import { describe, expect, it, vi } from "vitest";
import { createRetryableInit } from "./retryable-init";

describe("createRetryableInit", () => {
  it("同時呼び出しは 1 回の初期化を共有する", async () => {
    const init = vi.fn(async () => {});
    const run = createRetryableInit(init, vi.fn());
    await Promise.all([run(), run()]);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("成功後は再初期化しない", async () => {
    const init = vi.fn(async () => {});
    const run = createRetryableInit(init, vi.fn());
    await run();
    await run();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("失敗後の再呼び出しで再試行し、成功すれば以後は再実行しない", async () => {
    const error = new Error("load failed");
    const init = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(undefined);
    const onError = vi.fn();
    const run = createRetryableInit(init, onError);

    await run();
    expect(onError).toHaveBeenCalledWith(error);
    expect(init).toHaveBeenCalledTimes(1);

    await run();
    expect(init).toHaveBeenCalledTimes(2);

    await run();
    expect(init).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
