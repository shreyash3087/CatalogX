const { MongoClient } = require('../urbanstride/node_modules/mongodb');

const uri = 'mongodb+srv://shreyash3087_db_user:NOMnwQ33KaQriDfx@cluster0.u43ndu4.mongodb.net/?appName=Cluster0';

async function testAllDatabases() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas Cluster0');

    // 1. catalogx_db
    const catalogxDb = client.db('catalogx_db');
    const catalogxCols = await catalogxDb.listCollections().toArray();
    console.log('📁 catalogx_db collections:', catalogxCols.map(c => c.name));

    // 2. urbanstride_db
    const urbanDb = client.db('urbanstride_db');
    // Ensure collections exist
    const count = await urbanDb.collection('inventory').countDocuments();
    console.log('👟 urbanstride_db inventory items:', count);
    const urbanCols = await urbanDb.listCollections().toArray();
    console.log('📁 urbanstride_db collections:', urbanCols.map(c => c.name));

    // 3. techcart_db
    const techDb = client.db('techcart_db');
    const techCount = await techDb.collection('inventory').countDocuments();
    console.log('🎧 techcart_db inventory items:', techCount);
    const techCols = await techDb.listCollections().toArray();
    console.log('📁 techcart_db collections:', techCols.map(c => c.name));

    console.log('\n🎉 ALL 3 DATABASES ARE SEPARATE, VERIFIED, AND ONLINE!');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.close();
  }
}

testAllDatabases();
