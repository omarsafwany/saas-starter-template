import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Mock the email service wrapper so registration's verification + welcome
// emails never attempt a real Resend call, and so we have an assertion
// point proving they were "sent" via the wrapper rather than some other
// path. (Belt-and-suspenders on top of setupEnv.ts leaving RESEND_API_KEY
// unset, which already puts sendEmail() in its own no-op fallback.)
vi.mock("../src/services/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: false, reason: "mocked in tests" }),
}));

const { createApp } = await import("../src/app.js");
const { resetDb } = await import("./resetDb.js");
const { sendEmail } = await import("../src/services/email.js");

const app = createApp();

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

beforeEach(async () => {
  await resetDb();
  vi.mocked(sendEmail).mockClear();
});

describe("auth", () => {
  it("registers a new user and never calls the real email API", async () => {
    const email = uniqueEmail("register");

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);

    // sendVerificationEmail (sendOnSignUp) + the welcome databaseHook both
    // route through the service wrapper - never a real Resend client.
    expect(vi.mocked(sendEmail)).toHaveBeenCalled();
    const templates = vi.mocked(sendEmail).mock.calls.map(([args]) => args.template);
    expect(templates).toContain("welcome");
  });

  it("rejects registering the same email twice", async () => {
    const email = uniqueEmail("dupe");
    await request(app)
      .post("/api/auth/register")
      .send({ name: "First", email, password: "Password123!" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Second", email, password: "Password123!" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("logs in with correct credentials and rejects wrong ones", async () => {
    const email = uniqueEmail("login");
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Login User", email, password: "Password123!" });

    const good = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });
    expect(good.status).toBe(200);
    expect(good.body.user.email).toBe(email);

    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrong-password" });
    expect(bad.status).toBeGreaterThanOrEqual(400);
    expect(bad.status).toBeLessThan(500);
  });

  it("rejects unauthenticated access to a protected route with 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("allows an authenticated session to access a protected route", async () => {
    const email = uniqueEmail("session");
    const agent = request.agent(app);

    await agent
      .post("/api/auth/register")
      .send({ name: "Session User", email, password: "Password123!" });

    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });
});
