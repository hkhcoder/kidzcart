// KidzCart — MongoDB seed (products + donations)
// Safe to run multiple times (uses upserts).
//
//   mongosh "mongodb://127.0.0.1:27017/kids_marketplace" --file db/kids_marketplace_init.js
//
// The database is selected via the connection string above.
// Do NOT add a `use <db>;` statement here — it is not valid JS and will
// cause a SyntaxError when the file is loaded with --file.
//
// Images: add JPG/PNG/SVG under frontend/kids-marketplace-ui/src/assets/products/
// using the same letter as in `image` (e.g. a.jpg, b.jpg, … z.jpg).

db.products.createIndex({ category: 1 });
db.products.createIndex({ name: 1 });

const products = [
  {
    _id: 'p1',
    name: 'Kids Book - ABC',
    category: 'books',
    price: 100,
    description: 'Alphabet board book with bold letters and everyday words.',
    image: 'assets/products/a.jpg',
  },
  {
    _id: 'p2',
    name: 'Kids Book - Colors',
    category: 'books',
    price: 120,
    description: 'Bright pages that teach primary and secondary colors.',
    image: 'assets/products/b.jpg',
  },
  {
    _id: 'p3',
    name: 'Toy Car',
    category: 'toys',
    price: 300,
    description: 'Sturdy die-cast car with smooth-rolling wheels for small hands.',
    image: 'assets/icons/c.jpg',
  },
  {
    _id: 'p-a',
    name: 'The Very Hungry Caterpillar — Board Book',
    category: 'books',
    price: 199,
    description: 'Eric Carle classic; sturdy pages for toddlers and bedtime reading.',
    image: 'assets/products/d.jpg',
  },
  {
    _id: 'p-b',
    name: 'Goodnight Moon',
    category: 'books',
    price: 179,
    description: 'Calming bedtime rhyme; a nursery staple for ages 1–4.',
    image: 'assets/products/e.jpg',
  },
  {
    _id: 'p-c',
    name: 'Wooden Building Blocks — 32 Piece',
    category: 'toys',
    price: 649,
    description: 'Natural-finish blocks for stacking, counting, and open-ended play.',
    image: 'assets/products/f.jpg',
  },
  {
    _id: 'p-d',
    name: 'Remote Control Stunt Car',
    category: 'toys',
    price: 899,
    description: 'Rechargeable RC car with rubber tires; indoor-friendly speed.',
    image: 'assets/products/g.jpg',
  },
  {
    _id: 'p-e',
    name: 'Organic Cotton Tee — Sky Blue',
    category: 'clothes',
    price: 449,
    description: 'Tagless crew neck, machine washable; fits ages 4–5 (see size chart).',
    image: 'assets/products/h.jpg',
  },
  {
    _id: 'p-f',
    name: 'Fleece Zip Hoodie — Heather Gray',
    category: 'clothes',
    price: 799,
    description: 'Warm mid-weight fleece, full zip, lined hood for school days.',
    image: 'assets/products/j.jpg',
  },
  {
    _id: 'p-g',
    name: 'First 100 Words — Picture Dictionary',
    category: 'books',
    price: 249,
    description: 'Photographic vocabulary for early talkers; grouped by theme.',
    image: 'assets/products/k.jpg',
  },
  {
    _id: 'p-h',
    name: 'Treasury of Bedtime Stories',
    category: 'books',
    price: 399,
    description: 'Hardcover anthology: twelve short stories, about 20 minutes total read time.',
    image: 'assets/products/l.jpg',
  },
  {
    _id: 'p-i',
    name: 'Dr. Seuss — The Cat in the Hat',
    category: 'books',
    price: 229,
    description: 'Beginner-reader edition with iconic rhyme and full-color art.',
    image: 'assets/products/m.jpg',
  },
  {
    _id: 'p-j',
    name: 'LEGO Classic Creative Bricks',
    category: 'toys',
    price: 1299,
    description: 'Mixed bricks and plates in bright colors; ages 4+.',
    image: 'assets/products/n.jpg',
  },
  {
    _id: 'p-k',
    name: 'Plush Teddy Bear — 30 cm',
    category: 'toys',
    price: 549,
    description: 'Soft polyester fill, embroidered nose, surface-washable.',
    image: 'assets/products/o.jpg',
  },
  {
    _id: 'p-m',
    name: 'Kids Rain Boots — Navy',
    category: 'clothes',
    price: 699,
    description: 'Natural rubber, easy-pull handles, sizes toddler 7–13.',
    image: 'assets/products/p.jpg',
  },
  {
    _id: 'p-p',
    name: 'Play Kitchen Accessory Set',
    category: 'toys',
    price: 749,
    description: 'Pots, pans, and utensils sized for pretend cooking; BPA-free plastic.',
    image: 'assets/products/q.jpg',
  },
  {
    _id: 'p-q',
    name: 'Quilted Cotton Baby Blanket',
    category: 'clothes',
    price: 899,
    description: 'Lightweight layer for stroller or crib; breathable gauze trim.',
    image: 'assets/products/r.jpg',
  },
  {
    _id: 'p-r',
    name: 'Ride-On Push Scooter — LED Wheels',
    category: 'toys',
    price: 2199,
    description: 'Adjustable T-bar, rear foot brake; supports up to 50 kg.',
    image: 'assets/products/s.jpg',
  },
  {
    _id: 'p-s',
    name: 'Storytime Hand Puppet Set (6)',
    category: 'toys',
    price: 459,
    description: 'Machine-washable fabric puppets for classroom or home theater.',
    image: 'assets/products/t.jpg',
  },
  {
    _id: 'p-t',
    name: 'Twistable Crayons — 24 Pack',
    category: 'toys',
    price: 329,
    description: 'Break-resistant barrels; washable pigment on most fabrics.',
    image: 'assets/products/u.jpg',
  },
  {
    _id: 'p-u',
    name: 'Unicorn Mini Backpack',
    category: 'clothes',
    price: 599,
    description: 'Padded straps, front pocket, fits lunch box and water bottle.',
    image: 'assets/products/v.jpg',
  },
  {
    _id: 'p-v',
    name: 'Velcro Canvas Sneakers — White',
    category: 'clothes',
    price: 849,
    description: 'Wide opening for independent dressing; rubber outsole.',
    image: 'assets/products/w.jpg',
  },
  {
    _id: 'p-w',
    name: 'Water Wow! Reusable Doodle Pad',
    category: 'toys',
    price: 499,
    description: 'Fill the pen with water; colors appear and dry for repeat use.',
    image: 'assets/products/x.jpg',
  },
  {
    _id: 'p-x',
    name: 'Wooden Xylophone — 8 Keys',
    category: 'toys',
    price: 679,
    description: 'Metal bars, two mallets, tuned C major scale for first music lessons.',
    image: 'assets/products/y.jpg',
  },
  {
    _id: 'p-y',
    name: 'Yoga for Kids — Illustrated Guide',
    category: 'books',
    price: 319,
    description: 'Poses and breathing games for ages 5–10; illustrated step-by-step.',
    image: 'assets/products/z.jpg',
  },
  {
    _id: 'p-z',
    name: 'Zip-Up Cotton Pajama Set',
    category: 'clothes',
    price: 729,
    description: 'Snug fit, OEKO-TEX certified cotton; long sleeves for cooler nights.',
    image: 'assets/products/z1.jpg',
  },
];

products.forEach((doc) => {
  const { _id, ...fields } = doc;
  db.products.replaceOne({ _id }, { _id, ...fields }, { upsert: true });
});

db.donations.createIndex({ userId: 1 });
db.donations.createIndex({ status: 1 });

const donations = [
  {
    _id: 'd1',
    userId: 'u1',
    items: [{ name: 'Kids Book - ABC', category: 'books' }],
    note: 'Thanks for the books!',
    status: 'approved',
    createdAt: new Date(),
  },
];

donations.forEach((doc) => {
  const { _id, ...fields } = doc;
  db.donations.replaceOne({ _id }, { _id, ...fields }, { upsert: true });
});
