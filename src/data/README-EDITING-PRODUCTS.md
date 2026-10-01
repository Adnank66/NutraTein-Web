# 📝 How to Edit Product Prices, Images & Text in VS Code

All product prices, names, descriptions, and variants across NUTRATEIN are centrally managed in:
👉 **[`src/data/products-catalog.json`](./products-catalog.json)**

---

## ⚡ Quick 1-Minute Guide

### 1. Open the file in VS Code
Open `src/data/products-catalog.json` in VS Code or press `Ctrl + P` and type `products-catalog.json`.

---

### 2. Changing a Price
Find the product you want to change (e.g. `Nitrotein Performance Whey Protein`).
Locate the `variants` array and the root `price` / `mrp`:

```json
{
  "name": "Nitrotein Performance Whey Protein",
  "price": 3199,          // <-- Change selling price here
  "mrp": 4499,            // <-- Change printed MRP here
  "variants": [
    {
      "weight": "1 KG",
      "price": 3199,      // <-- Variant selling price
      "mrp": 4499         // <-- Variant printed MRP
    },
    {
      "weight": "2 KG",
      "price": 5999,      // <-- Variant selling price
      "mrp": 8499         // <-- Variant printed MRP
    }
  ]
}
```
Save the file (`Ctrl + S`). The changes reflect instantly across the storefront, 3D carousel, and preview page!

---

### 3. Changing Product Name, Tagline or Badge
Simply change the string value:
```json
"name": "Nitrotein Performance Whey Protein",
"posterTitle": "NITROTEIN PERFORMANCE WHEY PROTEIN",
"tagline": "THE ULTIMATE FUEL FOR MUSCLE GROWTH",
"badge": "BEST SELLER"
```

---

### 4. Changing Flavors
You can update `flavor` and the `flavors` list:
```json
"flavor": "Swiss Chocolate",
"flavors": ["Swiss Chocolate", "Cold Coffee", "Malai Kulfi"]
```

---

### 5. Changing Product Image or Poster
Point `image` or `posterImage` to any asset in `/assets/products/`:
```json
"image": "/assets/products/whey.jpg",
"posterImage": "/assets/products/NITRO-TEIN WHEY.jpeg"
```

---

## 🔍 Live Preview & Verification
You can inspect all products side-by-side with their original posters on the preview page:
👉 **`http://localhost:3000/catalog-preview`**
