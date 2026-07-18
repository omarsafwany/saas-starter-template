import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Registration touches the email service wrapper (verification + welcome
// emails); mock it here too so this suite never depends on/exercises a
// real Resend call either.
vi.mock("../src/services/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: false, reason: "mocked in tests" }),
}));

const { createApp } = await import("../src/app.js");
const { resetDb } = await import("./resetDb.js");

const app = createApp();

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function registerAgent(label: string) {
  const agent = request.agent(app);
  const email = uniqueEmail(label);
  const res = await agent
    .post("/api/auth/register")
    .send({ name: label, email, password: "Password123!" });
  expect(res.status).toBe(200);
  return agent;
}

beforeEach(async () => {
  await resetDb();
});

describe("items module", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/items");
    expect(res.status).toBe(401);
  });

  it("lets an authenticated user create, list, get, and update their own item", async () => {
    const a = await registerAgent("owner-a");

    const create = await a.post("/api/items").send({ title: "First item", body: "hello" });
    expect(create.status).toBe(201);
    const itemId = create.body.item.id as string;
    expect(create.body.item.title).toBe("First item");

    const list = await a.get("/api/items");
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].id).toBe(itemId);

    const getOne = await a.get(`/api/items/${itemId}`);
    expect(getOne.status).toBe(200);
    expect(getOne.body.item.id).toBe(itemId);

    const update = await a.patch(`/api/items/${itemId}`).send({ title: "Updated title" });
    expect(update.status).toBe(200);
    expect(update.body.item.title).toBe("Updated title");
  });

  it("returns 400 with field errors when creating an item without a title", async () => {
    const a = await registerAgent("bad-payload");

    const res = await a.post("/api/items").send({ body: "no title here" });
    expect(res.status).toBe(400);
    expect(res.body.error.fieldErrors.title).toBeDefined();
  });

  it("returns 404 (not 403) when a different user tries to read, update, or delete an item they don't own", async () => {
    const a = await registerAgent("owner-b");
    const b = await registerAgent("intruder-b");

    const create = await a.post("/api/items").send({ title: "A's item" });
    const itemId = create.body.item.id as string;

    const getAsB = await b.get(`/api/items/${itemId}`);
    expect(getAsB.status).toBe(404);

    const patchAsB = await b.patch(`/api/items/${itemId}`).send({ title: "hijacked" });
    expect(patchAsB.status).toBe(404);

    const deleteAsB = await b.delete(`/api/items/${itemId}`);
    expect(deleteAsB.status).toBe(404);

    // B's own list must stay empty - no leakage of A's item into B's view.
    const listAsB = await b.get("/api/items");
    expect(listAsB.body.items).toHaveLength(0);

    // A's item must be unaffected by B's attempts.
    const getAsA = await a.get(`/api/items/${itemId}`);
    expect(getAsA.status).toBe(200);
    expect(getAsA.body.item.title).toBe("A's item");
  });

  it("deletes an item as its owner and 404s on subsequent access", async () => {
    const a = await registerAgent("deleter");

    const create = await a.post("/api/items").send({ title: "Temporary" });
    const itemId = create.body.item.id as string;

    const del = await a.delete(`/api/items/${itemId}`);
    expect(del.status).toBe(204);

    const getAfterDelete = await a.get(`/api/items/${itemId}`);
    expect(getAfterDelete.status).toBe(404);
  });
});
