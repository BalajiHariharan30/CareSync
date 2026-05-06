const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');

    // Delete ALL entries with this email (handles duplicates)
    const deleted = await User.deleteMany({ email: 'admin@caresync.com' });
    console.log('🗑️  Deleted', deleted.deletedCount, 'admin@caresync.com entries');

    // Recreate fresh with isAdmin: true
    const salt = await bcrypt.genSalt(10);
    const admin = await User.create({
        name: 'Super Admin',
        email: 'admin@caresync.com',
        password: await bcrypt.hash('admin123', salt),
        isAdmin: true,
        isDoctor: false,
    });

    console.log('✅ Fresh admin created');
    console.log('   email  :', admin.email);
    console.log('   isAdmin:', admin.isAdmin);
    console.log('   _id    :', admin._id);

    // Verify by reading back from DB
    const verify = await User.findOne({ email: 'admin@caresync.com' });
    console.log('\n🔍 Verification read-back:');
    console.log('   isAdmin:', verify.isAdmin);

    mongoose.disconnect();
    console.log('\n✅ Done! Now login with admin@caresync.com / admin123');
};

run().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
