import '../src/config/load-env.js';
import { sequelize } from '../src/config/db.config.js';

const title = process.argv[2] || '%Smoke%';

const [rows] = await sequelize.query(
  `
  SELECT a.id, a.title, a.status, a.image_urls,
         aa.asset_id,
         ast.image_urls AS asset_image_urls
  FROM auctions a
  LEFT JOIN auction_assets aa ON aa.auction_id = a.id
  LEFT JOIN assets ast ON ast.id = aa.asset_id AND ast.deleted_at IS NULL
  WHERE a.deleted_at IS NULL AND a.title LIKE :title
  ORDER BY a.updated_at DESC
  LIMIT 10
  `,
  { replacements: { title } },
);

for (const row of rows) {
  console.log(JSON.stringify(row));
}

await sequelize.close();
