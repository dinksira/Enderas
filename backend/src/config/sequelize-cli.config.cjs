const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(name) {
  if (!(name in process.env)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (name === 'DB_PASSWORD') {
    return process.env[name];
  }

  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const shared = {
  username: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),
  host: requireEnv('DB_HOST'),
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
  migrationStorageTableName: 'sequelize_migrations',
  seederStorageTableName: 'sequelize_seeders',
  define: {
    underscored: true,
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

module.exports = {
  development: shared,
  production: shared,
};
