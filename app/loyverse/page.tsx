import { createLoyverseItem } from "@/lib/loyverse/item";

export default function Page() {
  async function addItem(formData: FormData) {
    "use server";

    const itemName = formData.get("item_name")?.toString();
    const description = formData.get("description")?.toString();
    const sku = formData.get("sku")?.toString();
    const price = Number(formData.get("price"));

    if (!itemName) {
      throw new Error("Item name is required.");
    }

    const item = await createLoyverseItem({
      item_name: itemName,

      description: description || "",

      track_stock: false,

      sold_by_weight: false,

      is_composite: false,

      form: "SQUARE",

      color: "GREY",

      variants: [
        {
          sku: sku || undefined,

          default_pricing_type: "FIXED",

          default_price: Number.isFinite(price) ? price : 0,
        },
      ],
    });

    console.log("Loyverse item created:", item);
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        Add Loyverse Item
      </h1>

      <form action={addItem} className="space-y-4">
        <div>
          <label
            htmlFor="item_name"
            className="block text-sm font-medium mb-1"
          >
            Item name
          </label>

          <input
            id="item_name"
            name="item_name"
            type="text"
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label
            htmlFor="sku"
            className="block text-sm font-medium mb-1"
          >
            SKU
          </label>

          <input
            id="sku"
            name="sku"
            type="text"
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium mb-1"
          >
            Price
          </label>

          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Add Item to Loyverse
        </button>
      </form>
    </main>
  );
}