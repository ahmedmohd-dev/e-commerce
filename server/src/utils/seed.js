require("dotenv").config();
const { connectDB } = require("../config/db");
const Product = require("../models/Product");

async function seed() {
  await connectDB();

  const now = new Date();
  const saleStart = new Date(now);
  saleStart.setDate(saleStart.getDate() - 1);
  const saleEnd = new Date(now);
  saleEnd.setDate(saleEnd.getDate() + 30);

  const sample = [
    // Electronics
    {
      name: "Samsung Galaxy S23 Ultra",
      slug: "samsung-galaxy-s23-ultra",
      price: 85000,
      description:
        "Flagship smartphone with 200MP camera, 12GB RAM, 256GB storage, and 6.8-inch Dynamic AMOLED display. Features S Pen support, 5000mAh battery, and 5G connectivity.",
      images: [
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800",
      ],
      category: "Electronics",
      brand: "Samsung",
      stock: 25,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 72000,
        start: saleStart,
        end: saleEnd,
        badgeText: "Limited",
        discountPercent: 15,
      },
    },
    {
      name: "Apple iPhone 15 Pro",
      slug: "apple-iphone-15-pro",
      price: 95000,
      description:
        "Premium iPhone with A17 Pro chip, 48MP main camera, ProMotion display, and titanium design. 256GB storage, Face ID, and all-day battery life.",
      images: [
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800",
      ],
      category: "Electronics",
      brand: "Apple",
      stock: 18,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Sony WH-1000XM5 Headphones",
      slug: "sony-wh-1000xm5-headphones",
      price: 32000,
      description:
        "Industry-leading noise cancellation, 30-hour battery life, premium sound quality with LDAC support. Comfortable over-ear design with quick charge.",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      ],
      category: "Electronics",
      brand: "Sony",
      stock: 42,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 25600,
        start: saleStart,
        end: saleEnd,
        badgeText: "Sale",
        discountPercent: 20,
      },
    },
    {
      name: "MacBook Pro 14-inch M3",
      slug: "macbook-pro-14-m3",
      price: 145000,
      description:
        "Powerful laptop with M3 chip, 16GB unified memory, 512GB SSD, Liquid Retina XDR display. Perfect for professionals and creatives.",
      images: [
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800",
      ],
      category: "Electronics",
      brand: "Apple",
      stock: 12,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Canon EOS R6 Mark II",
      slug: "canon-eos-r6-mark-ii",
      price: 185000,
      description:
        "Full-frame mirrorless camera with 24.2MP sensor, 4K video, advanced autofocus, and 6-stop image stabilization. Professional photography and videography.",
      images: [
        "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800",
      ],
      category: "Electronics",
      brand: "Canon",
      stock: 8,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "iPad Air 11-inch M2",
      slug: "ipad-air-11-m2",
      price: 65000,
      description:
        "Thin and light tablet with M2 chip, Liquid Retina display, 256GB storage. Supports Apple Pencil and Magic Keyboard. Perfect for work and creativity.",
      images: [
        "https://images.unsplash.com/photo-1544244015-0df4b3a8ab92?w=800",
      ],
      category: "Electronics",
      brand: "Apple",
      stock: 30,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 55250,
        start: saleStart,
        end: saleEnd,
        badgeText: "Limited",
        discountPercent: 15,
      },
    },

    // Clothing
    {
      name: "Premium Cotton T-Shirt",
      slug: "premium-cotton-tshirt",
      price: 850,
      description:
        "100% organic cotton t-shirt, soft and breathable. Available in multiple colors. Perfect for everyday wear with a modern fit.",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      ],
      category: "Clothing",
      brand: "MegaMart",
      stock: 150,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Classic Denim Jacket",
      slug: "classic-denim-jacket",
      price: 3200,
      description:
        "Timeless denim jacket with vintage wash. Durable construction, comfortable fit, and versatile styling. Perfect for layering.",
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
      ],
      category: "Clothing",
      brand: "Levi's",
      stock: 45,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 2560,
        start: saleStart,
        end: saleEnd,
        badgeText: "Sale",
        discountPercent: 20,
      },
    },
    {
      name: "Wool Blend Winter Coat",
      slug: "wool-blend-winter-coat",
      price: 5500,
      description:
        "Warm and stylish winter coat with 70% wool blend. Water-resistant outer shell, insulated lining, and multiple pockets. Perfect for cold weather.",
      images: [
        "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800",
      ],
      category: "Clothing",
      brand: "MegaMart",
      stock: 28,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Athletic Joggers",
      slug: "athletic-joggers",
      price: 1200,
      description:
        "Comfortable athletic joggers with stretch fabric, elastic waistband, and tapered fit. Perfect for workouts, running, or casual wear.",
      images: [
        "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800",
      ],
      category: "Clothing",
      brand: "Nike",
      stock: 95,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Formal Business Suit",
      slug: "formal-business-suit",
      price: 8500,
      description:
        "Elegant two-piece business suit in navy blue. Premium wool blend fabric, tailored fit, and professional appearance. Perfect for office and formal events.",
      images: [
        "https://images.unsplash.com/photo-1594938291221-94f18e0e7980?w=800",
      ],
      category: "Clothing",
      brand: "MegaMart",
      stock: 22,
      rating: 0,
      numReviews: 0,
    },

    // Footwear
    {
      name: "Nike Air Max 270",
      slug: "nike-air-max-270",
      price: 8500,
      description:
        "Iconic running shoes with Air Max cushioning, breathable mesh upper, and durable rubber outsole. Comfortable for all-day wear and athletic activities.",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
      ],
      category: "Footwear",
      brand: "Nike",
      stock: 60,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 6800,
        start: saleStart,
        end: saleEnd,
        badgeText: "Limited",
        discountPercent: 20,
      },
    },
    {
      name: "Adidas Ultraboost 23",
      slug: "adidas-ultraboost-23",
      price: 9200,
      description:
        "Premium running shoes with Boost midsole technology, Primeknit upper, and Continental rubber outsole. Maximum comfort and energy return.",
      images: [
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800",
      ],
      category: "Footwear",
      brand: "Adidas",
      stock: 48,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Leather Dress Shoes",
      slug: "leather-dress-shoes",
      price: 4500,
      description:
        "Classic leather dress shoes with polished finish, comfortable insole, and durable construction. Perfect for formal occasions and business attire.",
      images: [
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
      ],
      category: "Footwear",
      brand: "MegaMart",
      stock: 35,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Casual Canvas Sneakers",
      slug: "casual-canvas-sneakers",
      price: 1800,
      description:
        "Versatile canvas sneakers with rubber sole, comfortable fit, and classic design. Available in multiple colors. Perfect for everyday casual wear.",
      images: [
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800",
      ],
      category: "Footwear",
      brand: "Converse",
      stock: 120,
      rating: 0,
      numReviews: 0,
    },

    // Home & Kitchen
    {
      name: "Stainless Steel Cookware Set",
      slug: "stainless-steel-cookware-set",
      price: 6500,
      description:
        "10-piece premium cookware set with non-stick coating, heat-resistant handles, and dishwasher safe. Includes pots, pans, and lids. Perfect for modern kitchens.",
      images: [
        "https://images.unsplash.com/photo-1556911220-bff31c812d0b?w=800",
      ],
      category: "Home & Kitchen",
      brand: "MegaMart",
      stock: 40,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 5200,
        start: saleStart,
        end: saleEnd,
        badgeText: "Sale",
        discountPercent: 20,
      },
    },
    {
      name: "Smart Coffee Maker",
      slug: "smart-coffee-maker",
      price: 4200,
      description:
        "Programmable coffee maker with 12-cup capacity, auto-shutoff, and reusable filter. Brew strength control and keep-warm function. Start your day right.",
      images: [
        "https://images.unsplash.com/photo-1517668808825-f8920c9c0be5?w=800",
      ],
      category: "Home & Kitchen",
      brand: "MegaMart",
      stock: 55,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Memory Foam Mattress",
      slug: "memory-foam-mattress",
      price: 12500,
      description:
        "Queen-size memory foam mattress with cooling gel layer, pressure relief, and motion isolation. CertiPUR-US certified. 10-year warranty included.",
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      ],
      category: "Home & Kitchen",
      brand: "MegaMart",
      stock: 15,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Robot Vacuum Cleaner",
      slug: "robot-vacuum-cleaner",
      price: 18500,
      description:
        "Smart robot vacuum with app control, mapping technology, auto-recharge, and strong suction. Works on carpets and hard floors. Schedule cleaning from anywhere.",
      images: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      ],
      category: "Home & Kitchen",
      brand: "iRobot",
      stock: 20,
      rating: 0,
      numReviews: 0,
    },

    // Beauty & Personal Care
    {
      name: "Premium Skincare Set",
      slug: "premium-skincare-set",
      price: 3200,
      description:
        "Complete 5-piece skincare set with cleanser, toner, serum, moisturizer, and sunscreen. Natural ingredients, suitable for all skin types. Visible results in weeks.",
      images: [
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800",
      ],
      category: "Beauty & Personal Care",
      brand: "MegaMart",
      stock: 75,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Electric Hair Dryer",
      slug: "electric-hair-dryer",
      price: 2800,
      description:
        "Professional hair dryer with ionic technology, multiple heat settings, and concentrator nozzle. Fast drying, reduces frizz, and protects hair from heat damage.",
      images: [
        "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800",
      ],
      category: "Beauty & Personal Care",
      brand: "Dyson",
      stock: 38,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 2240,
        start: saleStart,
        end: saleEnd,
        badgeText: "Limited",
        discountPercent: 20,
      },
    },
    {
      name: "Men's Grooming Kit",
      slug: "mens-grooming-kit",
      price: 4500,
      description:
        "Complete grooming set with electric trimmer, razor, beard brush, and styling products. Waterproof design, long battery life, and precision cutting.",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
      ],
      category: "Beauty & Personal Care",
      brand: "Philips",
      stock: 52,
      rating: 0,
      numReviews: 0,
    },

    // Sports & Outdoors
    {
      name: "Yoga Mat Premium",
      slug: "yoga-mat-premium",
      price: 1200,
      description:
        "Eco-friendly yoga mat with non-slip surface, extra cushioning, and carrying strap. Perfect for yoga, pilates, and fitness exercises. Easy to clean.",
      images: [
        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800",
      ],
      category: "Sports & Outdoors",
      brand: "MegaMart",
      stock: 90,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Dumbbell Set 20kg",
      slug: "dumbbell-set-20kg",
      price: 8500,
      description:
        "Adjustable dumbbell set with weight plates, barbell bars, and storage rack. Perfect for home gym workouts. Durable construction and comfortable grips.",
      images: [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
      ],
      category: "Sports & Outdoors",
      brand: "MegaMart",
      stock: 25,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Camping Tent 4-Person",
      slug: "camping-tent-4-person",
      price: 12500,
      description:
        "Spacious 4-person camping tent with waterproof coating, easy setup, and ventilation windows. Includes rainfly and carry bag. Perfect for outdoor adventures.",
      images: [
        "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800",
      ],
      category: "Sports & Outdoors",
      brand: "Coleman",
      stock: 18,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 10000,
        start: saleStart,
        end: saleEnd,
        badgeText: "Sale",
        discountPercent: 20,
      },
    },

    // Books & Media
    {
      name: "Best Seller Book Collection",
      slug: "bestseller-book-collection",
      price: 2500,
      description:
        "Set of 5 bestselling novels including fiction, mystery, and self-help genres. Hardcover editions with beautiful covers. Perfect for book lovers and collectors.",
      images: [
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
      ],
      category: "Books & Media",
      brand: "MegaMart",
      stock: 65,
      rating: 0,
      numReviews: 0,
    },

    // Toys & Games
    {
      name: "LEGO Architecture Set",
      slug: "lego-architecture-set",
      price: 5500,
      description:
        "Detailed LEGO architecture set with 2000+ pieces. Build iconic landmarks with precision. Perfect for adults and older children. Display-worthy model.",
      images: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      ],
      category: "Toys & Games",
      brand: "LEGO",
      stock: 30,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Wireless Gaming Controller",
      slug: "wireless-gaming-controller",
      price: 3500,
      description:
        "Ergonomic wireless gaming controller with vibration feedback, long battery life, and responsive buttons. Compatible with PC, PlayStation, and Xbox. Enhanced gaming experience.",
      images: [
        "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800",
      ],
      category: "Toys & Games",
      brand: "Sony",
      stock: 45,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 2800,
        start: saleStart,
        end: saleEnd,
        badgeText: "Limited",
        discountPercent: 20,
      },
    },

    // Health & Wellness
    {
      name: "Smart Fitness Tracker",
      slug: "smart-fitness-tracker",
      price: 4500,
      description:
        "Advanced fitness tracker with heart rate monitor, sleep tracking, step counter, and smartphone notifications. Water-resistant design and 7-day battery life.",
      images: [
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800",
      ],
      category: "Health & Wellness",
      brand: "Fitbit",
      stock: 60,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Massage Gun Pro",
      slug: "massage-gun-pro",
      price: 8500,
      description:
        "Professional percussion massage gun with 5 speed levels, 4 massage heads, and long battery life. Relieves muscle tension and improves recovery. Perfect for athletes.",
      images: [
        "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800",
      ],
      category: "Health & Wellness",
      brand: "Theragun",
      stock: 22,
      rating: 0,
      numReviews: 0,
    },

    // Accessories
    {
      name: "Leather Wallet with RFID Protection",
      slug: "leather-wallet-rfid",
      price: 1800,
      description:
        "Premium genuine leather wallet with RFID blocking technology, multiple card slots, and cash compartment. Slim design, durable construction, and elegant appearance.",
      images: [
        "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800",
      ],
      category: "Accessories",
      brand: "MegaMart",
      stock: 85,
      rating: 0,
      numReviews: 0,
    },
    {
      name: "Designer Sunglasses",
      slug: "designer-sunglasses",
      price: 3200,
      description:
        "Stylish UV-protection sunglasses with polarized lenses, lightweight frame, and comfortable fit. Multiple color options. Perfect for outdoor activities and fashion.",
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800",
      ],
      category: "Accessories",
      brand: "Ray-Ban",
      stock: 48,
      rating: 0,
      numReviews: 0,
      sale: {
        isEnabled: true,
        price: 2560,
        start: saleStart,
        end: saleEnd,
        badgeText: "Sale",
        discountPercent: 20,
      },
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
