import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeLot } from '../src/services/auction.service.js';

const mockLot = {
  id: 'lot-123',
  auction_id: 'auction-123',
  asset_id: 'asset-123',
  reserve_price: '15000.00',
  sort_order: 1,
  lot_label: 'Lot 1',
  outcome_status: 'pending',
  tags: ['Urgent', 'Imported'],
  asset: {
    title: 'Excavator',
    asset_type: 'machinery',
    location: 'Addis',
    description: 'Heavy duty excavator.',
    condition_notes: 'Good condition',
    image_urls: JSON.stringify(['image1.jpg', 'image2.jpg']),
    additional_document_urls: ['doc1.pdf'],
  },
};

test('serializeLot preserves auction asset tags and tagList for browse payload', () => {
  const serialized = serializeLot(mockLot);

  assert.equal(serialized.id, 'lot-123');
  assert.deepEqual(serialized.tags, ['Urgent', 'Imported']);
  assert.deepEqual(serialized.tagList, ['Urgent', 'Imported']);
  assert.equal(serialized.assetTitle, 'Excavator');
  assert.equal(serialized.assetType, 'machinery');
  assert.equal(serialized.assetLocation, 'Addis');
  assert.equal(serialized.assetDescription, 'Heavy duty excavator.');
  assert.equal(serialized.assetConditionNotes, 'Good condition');
  assert.deepEqual(serialized.assetImages, ['image1.jpg', 'image2.jpg']);
  assert.deepEqual(serialized.assetDocuments, ['doc1.pdf']);
});
