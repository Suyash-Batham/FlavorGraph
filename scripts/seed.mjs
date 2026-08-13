/**
 * Seed script — run with: npm run seed
 * Requires: COGNODB_URI and COGNODB_PASSWORD in .env.local
 */
import neo4j from 'neo4j-driver';

const uri = process.env.COGNODB_URI;
const password = process.env.COGNODB_PASSWORD;

if (!uri || !password) {
  console.error('❌  Set COGNODB_URI and COGNODB_PASSWORD in .env.local first.');
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic('cognodb', password));
const session = driver.session();

// ─── Data ─────────────────────────────────────────────────────────────────────

const FLAVORS = [
  'Sweet', 'Bitter', 'Sour', 'Salty', 'Umami',
  'Earthy', 'Floral', 'Smoky', 'Spicy', 'Nutty',
  'Fruity', 'Herbal', 'Creamy', 'Caramel', 'Citrus',
];

const CUISINES = ['French', 'Italian', 'Japanese', 'Mexican', 'Middle Eastern'];

const INGREDIENTS = [
  // Chocolate & coffee family
  { name: 'Dark Chocolate',   category: 'Confectionery', description: 'Rich cacao with intense bitter-sweet depth' },
  { name: 'Milk Chocolate',   category: 'Confectionery', description: 'Creamier, sweeter chocolate' },
  { name: 'Espresso',         category: 'Beverage',      description: 'Concentrated coffee with roasted bitterness' },
  { name: 'Vanilla',          category: 'Spice',         description: 'Sweet, floral, slightly woody' },
  { name: 'Caramel',          category: 'Confectionery', description: 'Toasted sugar with buttery depth' },

  // Berries & fruit
  { name: 'Strawberry',       category: 'Fruit',         description: 'Fresh, bright red berry' },
  { name: 'Raspberry',        category: 'Fruit',         description: 'Tart berry with floral notes' },
  { name: 'Blueberry',        category: 'Fruit',         description: 'Sweet-tart berry with earthy undertones' },
  { name: 'Lemon',            category: 'Fruit',         description: 'Bright citrus, sharp acidity' },
  { name: 'Orange',           category: 'Fruit',         description: 'Sweet citrus with floral zest' },
  { name: 'Mango',            category: 'Fruit',         description: 'Tropical, sweet and slightly tart' },
  { name: 'Passion Fruit',    category: 'Fruit',         description: 'Intensely tart with floral-tropical aroma' },

  // Herbs & spices
  { name: 'Basil',            category: 'Herb',          description: 'Sweet, peppery and clove-like' },
  { name: 'Mint',             category: 'Herb',          description: 'Cool, refreshing and herbal' },
  { name: 'Rosemary',         category: 'Herb',          description: 'Woody, pine-like and aromatic' },
  { name: 'Thyme',            category: 'Herb',          description: 'Earthy, slightly floral herb' },
  { name: 'Cardamom',         category: 'Spice',         description: 'Warm spice with floral-citrus notes' },
  { name: 'Cinnamon',         category: 'Spice',         description: 'Warm, sweet-spicy bark' },
  { name: 'Chilli',           category: 'Spice',         description: 'Fiery heat with fruity backbone' },
  { name: 'Ginger',           category: 'Spice',         description: 'Pungent, warm with citrusy edge' },

  // Savoury
  { name: 'Tomato',           category: 'Vegetable',     description: 'Umami-rich with sweet acidity' },
  { name: 'Garlic',           category: 'Vegetable',     description: 'Pungent and deeply savoury' },
  { name: 'Parmesan',         category: 'Dairy',         description: 'Sharp, salty, crystalline aged cheese' },
  { name: 'Butter',           category: 'Dairy',         description: 'Rich, creamy, neutral fat' },
  { name: 'Miso',             category: 'Fermented',     description: 'Deeply savoury fermented soybean paste' },
  { name: 'Smoked Paprika',   category: 'Spice',         description: 'Earthy, smoky sweet-pepper' },
  { name: 'Olive Oil',        category: 'Oil',           description: 'Fruity, grassy Mediterranean fat' },

  // Nuts & seeds
  { name: 'Hazelnut',         category: 'Nut',           description: 'Sweet nut with earthy, toasty depth' },
  { name: 'Almond',           category: 'Nut',           description: 'Mild, sweet nut with faint bitter skin' },
  { name: 'Tahini',           category: 'Paste',         description: 'Ground sesame, nutty and slightly bitter' },
];

// ingredient → flavors
const INGREDIENT_FLAVORS = {
  'Dark Chocolate':  ['Bitter', 'Sweet', 'Earthy', 'Nutty'],
  'Milk Chocolate':  ['Sweet', 'Creamy', 'Caramel'],
  'Espresso':        ['Bitter', 'Smoky', 'Nutty', 'Caramel'],
  'Vanilla':         ['Sweet', 'Floral', 'Creamy'],
  'Caramel':         ['Sweet', 'Caramel', 'Bitter'],
  'Strawberry':      ['Sweet', 'Fruity', 'Sour'],
  'Raspberry':       ['Sour', 'Fruity', 'Floral'],
  'Blueberry':       ['Sweet', 'Fruity', 'Earthy'],
  'Lemon':           ['Sour', 'Citrus', 'Floral'],
  'Orange':          ['Sweet', 'Citrus', 'Floral'],
  'Mango':           ['Sweet', 'Fruity', 'Citrus'],
  'Passion Fruit':   ['Sour', 'Fruity', 'Floral'],
  'Basil':           ['Herbal', 'Sweet', 'Spicy'],
  'Mint':            ['Herbal', 'Floral', 'Sweet'],
  'Rosemary':        ['Herbal', 'Earthy', 'Smoky'],
  'Thyme':           ['Herbal', 'Earthy', 'Floral'],
  'Cardamom':        ['Spicy', 'Floral', 'Citrus'],
  'Cinnamon':        ['Sweet', 'Spicy', 'Earthy'],
  'Chilli':          ['Spicy', 'Fruity', 'Smoky'],
  'Ginger':          ['Spicy', 'Citrus', 'Earthy'],
  'Tomato':          ['Umami', 'Sour', 'Sweet'],
  'Garlic':          ['Umami', 'Spicy', 'Earthy'],
  'Parmesan':        ['Umami', 'Salty', 'Nutty'],
  'Butter':          ['Creamy', 'Sweet', 'Salty'],
  'Miso':            ['Umami', 'Salty', 'Earthy'],
  'Smoked Paprika':  ['Smoky', 'Spicy', 'Earthy'],
  'Olive Oil':       ['Fruity', 'Earthy', 'Herbal'],
  'Hazelnut':        ['Nutty', 'Sweet', 'Earthy'],
  'Almond':          ['Nutty', 'Sweet', 'Floral'],
  'Tahini':          ['Nutty', 'Bitter', 'Earthy'],
};

// [a, b, strength]
const PAIRINGS = [
  ['Dark Chocolate', 'Espresso',       'strong'],
  ['Dark Chocolate', 'Raspberry',      'strong'],
  ['Dark Chocolate', 'Chilli',         'strong'],
  ['Dark Chocolate', 'Orange',         'strong'],
  ['Dark Chocolate', 'Hazelnut',       'strong'],
  ['Dark Chocolate', 'Mint',           'moderate'],
  ['Dark Chocolate', 'Caramel',        'moderate'],
  ['Dark Chocolate', 'Vanilla',        'moderate'],
  ['Espresso',       'Cardamom',       'strong'],
  ['Espresso',       'Vanilla',        'strong'],
  ['Espresso',       'Hazelnut',       'strong'],
  ['Espresso',       'Caramel',        'strong'],
  ['Espresso',       'Cinnamon',       'moderate'],
  ['Vanilla',        'Strawberry',     'strong'],
  ['Vanilla',        'Raspberry',      'strong'],
  ['Vanilla',        'Almond',         'strong'],
  ['Vanilla',        'Caramel',        'strong'],
  ['Vanilla',        'Lemon',          'moderate'],
  ['Strawberry',     'Basil',          'strong'],
  ['Strawberry',     'Lemon',          'strong'],
  ['Strawberry',     'Mint',           'moderate'],
  ['Strawberry',     'Balsamic',       'moderate'],
  ['Raspberry',      'Lemon',          'strong'],
  ['Raspberry',      'Mint',           'moderate'],
  ['Raspberry',      'Thyme',          'moderate'],
  ['Lemon',          'Thyme',          'strong'],
  ['Lemon',          'Ginger',         'strong'],
  ['Lemon',          'Mint',           'strong'],
  ['Lemon',          'Basil',          'moderate'],
  ['Orange',         'Cardamom',       'strong'],
  ['Orange',         'Ginger',         'strong'],
  ['Orange',         'Cinnamon',       'moderate'],
  ['Orange',         'Mango',          'moderate'],
  ['Mango',          'Chilli',         'strong'],
  ['Mango',          'Ginger',         'moderate'],
  ['Mango',          'Passion Fruit',  'strong'],
  ['Passion Fruit',  'Raspberry',      'moderate'],
  ['Basil',          'Tomato',         'strong'],
  ['Basil',          'Garlic',         'strong'],
  ['Basil',          'Olive Oil',      'strong'],
  ['Basil',          'Parmesan',       'strong'],
  ['Tomato',         'Garlic',         'strong'],
  ['Tomato',         'Olive Oil',      'strong'],
  ['Tomato',         'Parmesan',       'strong'],
  ['Garlic',         'Rosemary',       'strong'],
  ['Garlic',         'Miso',           'moderate'],
  ['Garlic',         'Thyme',          'strong'],
  ['Parmesan',       'Butter',         'strong'],
  ['Butter',         'Caramel',        'strong'],
  ['Butter',         'Almond',         'strong'],
  ['Hazelnut',       'Caramel',        'strong'],
  ['Hazelnut',       'Almond',         'moderate'],
  ['Almond',         'Cardamom',       'moderate'],
  ['Tahini',         'Lemon',          'strong'],
  ['Tahini',         'Garlic',         'strong'],
  ['Tahini',         'Miso',           'moderate'],
  ['Miso',           'Ginger',         'strong'],
  ['Miso',           'Smoked Paprika', 'moderate'],
  ['Smoked Paprika', 'Chilli',         'moderate'],
  ['Smoked Paprika', 'Garlic',         'strong'],
  ['Cinnamon',       'Cardamom',       'strong'],
  ['Cinnamon',       'Ginger',         'moderate'],
  ['Rosemary',       'Thyme',          'moderate'],
  ['Rosemary',       'Lemon',          'moderate'],
  ['Mint',           'Cardamom',       'subtle'],
  ['Blueberry',      'Lemon',          'strong'],
  ['Blueberry',      'Vanilla',        'moderate'],
  ['Blueberry',      'Thyme',          'moderate'],
];

const SUBSTITUTES = [
  ['Dark Chocolate', 'Milk Chocolate'],
  ['Butter',         'Olive Oil'],
  ['Lemon',          'Passion Fruit'],
  ['Espresso',       'Dark Chocolate'],
  ['Miso',           'Parmesan'],
];

const DISHES = [
  { name: 'Tiramisu',            cuisine: 'Italian',       ingredients: ['Espresso', 'Vanilla', 'Butter', 'Dark Chocolate'] },
  { name: 'Chocolate Fondant',   cuisine: 'French',        ingredients: ['Dark Chocolate', 'Butter', 'Almond', 'Vanilla'] },
  { name: 'Panna Cotta',         cuisine: 'Italian',       ingredients: ['Vanilla', 'Raspberry', 'Lemon'] },
  { name: 'Mango Salsa',         cuisine: 'Mexican',       ingredients: ['Mango', 'Chilli', 'Lemon', 'Basil'] },
  { name: 'Shakshuka',           cuisine: 'Middle Eastern',ingredients: ['Tomato', 'Garlic', 'Smoked Paprika', 'Chilli'] },
  { name: 'Pasta al Pomodoro',   cuisine: 'Italian',       ingredients: ['Tomato', 'Basil', 'Garlic', 'Olive Oil', 'Parmesan'] },
  { name: 'Cardamom Latte',      cuisine: 'Middle Eastern',ingredients: ['Espresso', 'Cardamom', 'Vanilla'] },
  { name: 'Raspberry Macarons',  cuisine: 'French',        ingredients: ['Raspberry', 'Almond', 'Vanilla', 'Butter'] },
  { name: 'Miso Ramen',          cuisine: 'Japanese',      ingredients: ['Miso', 'Ginger', 'Garlic'] },
  { name: 'Hummus',              cuisine: 'Middle Eastern',ingredients: ['Tahini', 'Garlic', 'Lemon', 'Smoked Paprika', 'Olive Oil'] },
];

// ─── Seeding ──────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Connecting to CognoDB …');
  await driver.verifyConnectivity();
  console.log('✅  Connected.\n');

  console.log('🗑   Clearing existing data …');
  await session.run('MATCH (n) DETACH DELETE n');

  // Constraints & indexes
  console.log('🔧  Creating constraints …');
  await session.run('CREATE CONSTRAINT ingredient_name IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.name IS UNIQUE');
  await session.run('CREATE CONSTRAINT flavor_name IF NOT EXISTS FOR (f:Flavor) REQUIRE f.name IS UNIQUE');
  await session.run('CREATE CONSTRAINT cuisine_name IF NOT EXISTS FOR (c:Cuisine) REQUIRE c.name IS UNIQUE');
  await session.run('CREATE CONSTRAINT dish_name IF NOT EXISTS FOR (d:Dish) REQUIRE d.name IS UNIQUE');

  // Flavors
  console.log('🍋  Seeding flavors …');
  for (const flavor of FLAVORS) {
    await session.run('MERGE (:Flavor {name: $name})', { name: flavor });
  }

  // Cuisines
  console.log('🌍  Seeding cuisines …');
  for (const cuisine of CUISINES) {
    await session.run('MERGE (:Cuisine {name: $name})', { name: cuisine });
  }

  // Ingredients
  console.log('🫙  Seeding ingredients …');
  for (const ing of INGREDIENTS) {
    await session.run(
      'MERGE (i:Ingredient {name: $name}) SET i.description = $description, i.category = $category',
      ing
    );
  }

  // Ingredient → Flavor
  console.log('🔗  Linking ingredients to flavors …');
  for (const [ingName, flavors] of Object.entries(INGREDIENT_FLAVORS)) {
    for (const flavor of flavors) {
      await session.run(
        `MATCH (i:Ingredient {name: $ing}), (f:Flavor {name: $flavor})
         MERGE (i)-[:HAS_FLAVOR]->(f)`,
        { ing: ingName, flavor }
      );
    }
  }

  // Pairings
  console.log('🤝  Creating pairing relationships …');
  for (const [a, b, strength] of PAIRINGS) {
    // Skip any ingredient not in our set (e.g. 'Balsamic' placeholder)
    await session.run(
      `MATCH (a:Ingredient {name: $a}), (b:Ingredient {name: $b})
       MERGE (a)-[r:PAIRS_WITH]-(b)
       SET r.strength = $strength`,
      { a, b, strength }
    ).catch(() => {}); // ignore if either node missing
  }

  // Substitutes
  console.log('🔄  Creating substitute relationships …');
  for (const [a, b] of SUBSTITUTES) {
    await session.run(
      `MATCH (a:Ingredient {name: $a}), (b:Ingredient {name: $b})
       MERGE (a)-[:SUBSTITUTE_FOR]-(b)`,
      { a, b }
    );
  }

  // Dishes + USED_IN + BELONGS_TO
  console.log('🍽   Seeding dishes …');
  for (const dish of DISHES) {
    await session.run(
      `MERGE (d:Dish {name: $name})
       WITH d
       MATCH (c:Cuisine {name: $cuisine})
       MERGE (d)-[:BELONGS_TO]->(c)`,
      { name: dish.name, cuisine: dish.cuisine }
    );
    for (const ing of dish.ingredients) {
      await session.run(
        `MATCH (i:Ingredient {name: $ing}), (d:Dish {name: $dish})
         MERGE (i)-[:USED_IN]->(d)`,
        { ing, dish: dish.name }
      );
    }
  }

  const counts = await session.run(`
    MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count
    ORDER BY label
  `);
  console.log('\n📊  Seed complete:');
  for (const r of counts.records) {
    console.log(`   ${r.get('label')}: ${r.get('count')} nodes`);
  }

  const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) AS count');
  console.log(`   Relationships: ${relCount.records[0].get('count')}`);
  console.log('\n🎉  Ready! Run: npm run dev');
}

seed()
  .catch((err) => { console.error('❌  Seed failed:', err); process.exit(1); })
  .finally(() => { session.close(); driver.close(); });
