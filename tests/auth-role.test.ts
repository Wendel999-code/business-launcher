import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPage, deriveRedirectPath, normalizeRole } from "../lib/auth";

test("handles the application roles and redirect paths", () => {
  assert.equal(normalizeRole("owner"), "owner");
  assert.equal(normalizeRole("admin"), "admin");
  assert.equal(normalizeRole("manager"), "branch");
  assert.equal(normalizeRole("staff"), "branch");

  assert.equal(deriveRedirectPath("owner"), "/owner");
  assert.equal(deriveRedirectPath("admin"), "/admin");
  assert.equal(deriveRedirectPath("branch"), "/branch");
});

test("restricts administrative pages to trusted roles", () => {
  assert.equal(canAccessPage("owner", "products"), true);
  assert.equal(canAccessPage("admin", "products"), true);
  assert.equal(canAccessPage("branch", "products"), false);
  assert.equal(canAccessPage("owner", "dashboard"), true);
  assert.equal(canAccessPage("branch", "dashboard"), true);
});
