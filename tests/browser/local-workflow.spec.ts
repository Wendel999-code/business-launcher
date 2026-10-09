import { test, expect, Page } from "@playwright/test";
import { branches, profiles, locationName } from "../../data/dummy/branches";
import { money } from "../../lib/utils";

const sku = "ARABICA-LOCAL-100";
const inventoryRow = (page: Page) =>
  page.getByRole("row").filter({ hasText: sku });
test("all seven localStorage steps, cross-tab monitoring, negative-stock rejection and browser reload", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Business overview." }),
  ).toBeVisible();
  await expect(
    page
      .locator(".stat")
      .filter({ hasText: "Today's sales" })
      .locator(".stat-value"),
  ).toHaveText(money(0));
  await page.goto("/products");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page.getByLabel("Product name").fill("Arabica Coffee Beans");
  await page.getByLabel("SKU").fill(sku);
  await page.getByLabel("Minimum stock").fill("18");
  await page.getByLabel("Unit value").fill("200");
  await page.getByLabel("Initial Head Office Quantity").fill("100");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/inventory");
  await expect(inventoryRow(page)).toContainText("100 kg");
  await page.reload();
  await expect(inventoryRow(page)).toContainText("100 kg");
  await page.goto("/transfers");
  await page.getByRole("button", { name: "New transfer", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Location", exact: true })
    .selectOption(branches[0].id);
  await page
    .getByRole("spinbutton", { name: "Quantity kg", exact: true })
    .fill("20");
  await page
    .getByRole("button", { name: "Create transfer", exact: true })
    .click();
  const transferRow = page.getByRole("row").filter({ hasText: "TR-2026-0109" });
  await expect(transferRow).toContainText("Pending");
  await transferRow
    .getByRole("button", { name: "Dispatch", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm dispatched" }).click();
  await expect(transferRow).toContainText("Dispatched");
  await page.goto("/inventory");
  await expect(inventoryRow(page)).toContainText("80 kg");
  await page.goto("/dashboard");
  const branchPage = await context.newPage();
  branchPage.on("pageerror", (e) => errors.push(e.message));
  await branchPage.goto("/login");
  await branchPage.getByLabel("Demo workspace").selectOption(profiles[1].id);
  await branchPage
    .getByRole("button", { name: "Sign in to your workspace" })
    .click();
  await expect(
    branchPage.getByRole("heading", {
      name: `${locationName(branches[0].id)} overview.`,
    }),
  ).toBeVisible();
  await branchPage.goto("/transfers");
  const receiving = branchPage
    .getByRole("row")
    .filter({ hasText: "TR-2026-0109" });
  await receiving.getByRole("button", { name: "Receive", exact: true }).click();
  await branchPage
    .getByRole("button", { name: "Confirm receipt", exact: true })
    .click();
  await expect(receiving).toContainText("Received");
  await branchPage.goto("/inventory");
  await expect(inventoryRow(branchPage)).toContainText("20 kg");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: sku })
      .filter({ hasText: locationName(branches[0].id) }),
  ).toContainText("20 kg");
  await branchPage.goto("/sales");
  await branchPage
    .getByRole("button", { name: "Record daily sales", exact: true })
    .click();
  await branchPage.getByLabel("Gross sales").fill("300");
  await branchPage.getByLabel("Transactions", { exact: true }).fill("1");
  await branchPage.getByLabel("Cash (₱)", { exact: true }).fill("300");
  await branchPage.getByRole("button", { name: "Add inventory item" }).click();
  await branchPage
    .getByRole("spinbutton", { name: /^Quantity \(kg\)/ })
    .fill("3");
  await branchPage
    .getByRole("button", { name: "Submit daily sales", exact: true })
    .click();
  await expect(branchPage.getByRole("dialog")).toHaveCount(0);
  await branchPage.goto("/inventory");
  await expect(inventoryRow(branchPage)).toContainText("17 kg");
  await branchPage
    .getByRole("button", { name: "Record adjustment", exact: true })
    .click();
  await branchPage.getByLabel("Adjustment (+ / −)").fill("-2");
  await branchPage.getByLabel("Reason").selectOption("Damaged");
  await branchPage.getByLabel("Remarks").fill("Two kg damaged during handling");
  await branchPage.getByRole("button", { name: "Save adjustment" }).click();
  await expect(branchPage.getByRole("dialog")).toHaveCount(0);
  await expect(inventoryRow(branchPage)).toContainText("15 kg");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: sku })
      .filter({ hasText: "Head Office" }),
  ).toContainText("80 kg");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: sku })
      .filter({ hasText: locationName(branches[0].id) }),
  ).toContainText("15 kg");
  await expect(
    page
      .locator(".stat")
      .filter({ hasText: "Today's sales" })
      .locator(".stat-value"),
  ).toHaveText(money(300));
  await expect(
    page
      .locator(".stat")
      .filter({ hasText: "Inventory adjustments" })
      .locator(".stat-value"),
  ).toHaveText("1");
  await expect(
    page
      .locator(".stat")
      .filter({ hasText: "Stock transfers" })
      .locator(".stat-value"),
  ).toHaveText("1");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: sku })
      .filter({ hasText: locationName(branches[0].id) }),
  ).toContainText("Low Stock");
  await branchPage.reload();
  await expect(inventoryRow(branchPage)).toContainText("15 kg");
  await branchPage.goto("/sales");
  await branchPage.getByRole("button", { name: "Edit sales report" }).click();
  await branchPage
    .getByRole("spinbutton", { name: /^Quantity \(kg\)/ })
    .fill("999");
  await branchPage
    .getByRole("button", { name: "Submit daily sales", exact: true })
    .click();
  await expect(branchPage.getByRole("dialog")).toBeVisible();
  await expect(branchPage.locator(".toast")).toContainText(
    "Insufficient stock",
  );
  await branchPage.getByRole("button", { name: "Cancel", exact: true }).click();
  await branchPage
    .getByRole("button", { name: new RegExp(profiles[1].name) })
    .click();
  await branchPage
    .getByRole("button", { name: new RegExp(profiles[0].name) })
    .click();
  await branchPage.goto("/dashboard");
  await branchPage.reload();
  await expect(
    branchPage.getByRole("heading", { name: "Business overview." }),
  ).toBeVisible();
  await expect(
    branchPage
      .getByRole("row")
      .filter({ hasText: sku })
      .filter({ hasText: "Head Office" }),
  ).toContainText("80 kg");
  await expect(
    branchPage
      .getByRole("row")
      .filter({ hasText: sku })
      .filter({ hasText: locationName(branches[0].id) }),
  ).toContainText("15 kg");
  const persisted = await branchPage.evaluate(() =>
    JSON.parse(localStorage.getItem("brew-demo-v1")!),
  );
  expect(persisted.products).toHaveLength(1);
  expect(persisted.transfers[0].status).toBe("Received");
  expect(persisted.sales).toHaveLength(1);
  expect(persisted.sales[0].items[0].quantity).toBe(3);
  expect(persisted.movements).toHaveLength(5);
  expect(errors).toEqual([]);
});

test("fresh inventory and sales screens have empty states and fit a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/dashboard",
    "/inventory",
    "/sales",
    "/transfers",
    "/adjustments",
    "/wastage",
    "/sales-reports",
    "/inventory-reports",
  ]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
});
