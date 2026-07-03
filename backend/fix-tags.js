const sequelize = require('./config/db');

async function fixTags() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');
        await sequelize.query(`ALTER TABLE SuccessStories ADD COLUMN tags TEXT;`);
        console.log('Column successfully updated in database!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating ENUM:', err);
        process.exit(1);
    }
}
fixTags();
