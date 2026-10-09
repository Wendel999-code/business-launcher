import { test, expect } from "@playwright/test";
import { initialStore } from "../../data/dummy";
import { normalizeStoredLocations } from "../../lib/storage-migrations";
import { branches, locationName } from "../../data/dummy/branches";
test.beforeEach(async ({page}) => {
  await page.addInitScript(store => {
    if (!localStorage.getItem("qa-seeded")) {
      localStorage.setItem("brew-demo-v1", JSON.stringify(store));
      localStorage.setItem("brew-profile", "admin");
      localStorage.setItem("qa-seeded", "true");
    }
  }, normalizeStoredLocations(initialStore));
});
test("Head Office dispatch and destination receipt update inventory with history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Business overview." }),
  ).toBeVisible();
  await page.goto("/transfers");
  await page.getByRole("button", { name: "New transfer", exact: true }).click();
  await page
    .getByRole("button", { name: "Create transfer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/transfers");
  const row = page.getByRole("row").filter({ hasText: "TR-2026-0109" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Dispatch", exact: true }).click();
  await page.getByRole("button", { name: "Confirm dispatched" }).click();
  await expect(row).toContainText("Dispatched");
  await page.getByRole("button", { name: /Alex Morgan/ }).click();
  await page.getByRole("button", { name: /Isabella Reyes/ }).click();
  await expect(
    page.getByRole("heading", { name: `${locationName(branches[0].id)} overview.` }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Branches", exact: true }),
  ).toHaveCount(0);
  await page.goto("/transfers");
  const incoming = page.getByRole("row").filter({ hasText: "TR-2026-0109" });
  await incoming.getByRole("button", { name: "Receive", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm receipt", exact: true })
    .click();
  await expect(incoming).toContainText("Received");
  await page.goto("/inventory");
  await expect(
    page.getByRole("row").filter({ hasText: "BEAN-001" }),
  ).toContainText("62");
  await page.goto("/movements");
  await expect(
    page.getByRole("row").filter({ hasText: "TR-2026-0109" }),
  ).toContainText("Transfer In");
  await page.goto("/products");
  await expect(
    page.getByRole("heading", { name: "Head Office access required" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Head Office access required" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("sales edit, payment validation, table search and notifications work", async ({
  page,
}) => {
  await page.goto("/sales");
  const row = page
    .getByRole("row")
    .filter({ hasText: locationName(branches[0].id) })
    .filter({ hasText: "Oct 8, 2026" });
  await row.getByRole("button", { name: "Edit sales report" }).click();
  await page.getByLabel("Gross sales").fill("70000");
  await page.getByLabel("Discounts").fill("1250");
  await page.getByLabel("Cash (₱)", { exact: true }).fill("30000");
  await page.getByLabel("GCash / E-Wallet").fill("30000");
  await page.getByLabel("Card (₱)", { exact: true }).fill("8750");
  await page
    .getByRole("button", { name: "Submit daily sales", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(row).toContainText("₱68,750");
  await page
    .getByRole("textbox", { name: "Search Daily sales" })
    .fill(branches[1].name);
  await expect(
    page.getByRole("cell", { name: locationName(branches[0].id), exact: true }),
  ).toHaveCount(0);
  await page.goto("/notifications");
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await page.getByRole("checkbox", { name: "Unread only" }).check();
  await expect(
    page.getByRole("heading", { name: "You're all caught up" }),
  ).toBeVisible();
});
test("mobile navigation and key pages fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Business overview." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Inventory", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Inventory." })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page.locator(".form-error")).toContainText("demo password");
  await page.getByLabel("Demo workspace").selectOption(branches[1].id);
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: `${locationName(branches[1].id)} overview.` }),
  ).toBeVisible();
});

test("counts, products, report views and saved settings work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/inventory");
  await page.getByRole("button", { name: "Stock count", exact: true }).click();
  await page.getByLabel(/Physical quantity/).fill("238");
  await page
    .getByLabel(/Remarks/)
    .fill("Two kg variance confirmed during closing count");
  await page
    .getByRole("button", { name: "Confirm stock count", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("row").filter({ hasText: "BEAN-001" }),
  ).toContainText("238");
  await page.goto("/inventory-reports");
  for (const tab of [
    "Low stock",
    "Movements",
    "Transfers",
    "Adjustments",
    "Wastage",
    "Physical counts",
  ]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await expect(page.locator(".data-panel")).toBeVisible();
  }
  await expect(
    page.getByRole("row").filter({ hasText: "Head Office" }),
  ).toContainText("238");
  await page.goto("/products");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page.getByLabel("Product name").fill("Matcha Powder");
  await page.getByLabel("SKU").fill("PWD-NEW");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search Product catalog" })
    .fill("PWD-NEW");
  const product = page.getByRole("row").filter({ hasText: "PWD-NEW" });
  await expect(product).toContainText("Active");
  await product
    .getByRole("button", { name: "Deactivate", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(product).toContainText("Inactive");
  await page.goto("/settings");
  await page.getByLabel("Contact email").fill("operations@brewcoffee.ph");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Contact email" }),
  ).toHaveValue("operations@brewcoffee.ph");
  for (const path of [
    "/branches",
    `/branches/${encodeURIComponent(branches[0].id)}`,
    "/users",
    "/sales-reports",
    "/branch-performance",
    "/wastage",
    "/activity",
    "/adjustments",
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
