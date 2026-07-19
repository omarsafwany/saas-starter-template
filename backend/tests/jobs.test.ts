import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from "pg-boss";
import type { SendWelcomeEmailData } from "../src/config/jobs.js";

// Same mocking pattern as tests/auth.test.ts: never let the job handler
// touch a real Resend client.
vi.mock("../src/services/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: false, reason: "mocked in tests" }),
}));

const { sendEmail } = await import("../src/services/email.js");
const { handleSendWelcomeEmail, handleNightlyCleanup } = await import("../src/config/jobs.js");

function fakeJob(data: SendWelcomeEmailData): Job<SendWelcomeEmailData> {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "send-welcome-email",
    data,
    expireInSeconds: 900,
    heartbeatSeconds: null,
    signal: new AbortController().signal,
  };
}

beforeEach(() => {
  vi.mocked(sendEmail).mockClear();
});

describe("jobs", () => {
  describe("handleSendWelcomeEmail", () => {
    it("sends the welcome template for every job in the batch", async () => {
      await handleSendWelcomeEmail([
        fakeJob({ email: "ada@example.com", name: "Ada Lovelace" }),
        fakeJob({ email: "grace@example.com" }),
      ]);

      expect(sendEmail).toHaveBeenCalledTimes(2);
      expect(sendEmail).toHaveBeenNthCalledWith(1, {
        to: "ada@example.com",
        template: "welcome",
        data: { name: "Ada Lovelace", loginUrl: expect.any(String) },
      });
      expect(sendEmail).toHaveBeenNthCalledWith(2, {
        to: "grace@example.com",
        template: "welcome",
        data: { name: undefined, loginUrl: expect.any(String) },
      });
    });
  });

  describe("handleNightlyCleanup", () => {
    it("runs without throwing (template scheduled job)", async () => {
      await expect(handleNightlyCleanup()).resolves.toBeUndefined();
    });
  });
});
