require("dotenv").config();
const { connectDB } = require("../config/db");
const Product = require("../models/Product");

async function seed() {
  await connectDB();
  const sample = [
    {
      name: "Basic T-Shirt",
      slug: "basic-tshirt",
      price: 15,
      description: "Soft cotton tee for everyday wear.",
      images: [
        "https://images.unsplash.com/photo-1520975673314-06db8a6715ac?w=1200",
      ],
      category: "Clothing",
      brand: "Generic",
      stock: 100,
    },
    {
      name: "Running Shoes",
      slug: "running-shoes",
      price: 65,
      description: "Comfortable trainers for jogging and gym.",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200",
      ],
      category: "Footwear",
      brand: "Generic",
      stock: 50,
    },
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      price: 99,
      description: "Over-ear, noise isolated, long battery life.",
      images: [
        "https://images.unsplash.com/photo-1518441902113-c1d287f76d24?w=1200",
      ],
      category: "Electronics",
      brand: "Generic",
      stock: 30,
    },
  ];

  await Product.deleteMany({});
  await Product.insertMany(sample);
  console.log(`Seeded ${sample.length} products`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});





