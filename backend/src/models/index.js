import { User } from './user.model.js';
import { Role } from './role.model.js';
import { Staff } from './staff.model.js';
import { RefreshToken } from './refreshToken.model.js';
import { AuditLog } from './auditLog.model.js';
import { KYCVerification } from './kyc.model.js';
import { Auction } from './auction.model.js';
import { AuctionAsset } from './auctionAsset.model.js';
import { AssetOwner } from './assetOwner.model.js';
import { Asset } from './asset.model.js';
import { Notification } from './notification.model.js';
import { SystemSetting } from './systemSetting.model.js';
import { Evaluation } from './evaluation.model.js';
import { Payment } from './payment.model.js';
import { Cpo } from './cpo.model.js';
import { CpoPayment } from './cpoPayment.model.js';
import { Bid } from './bid.model.js';
import { BidDraft } from './bidDraft.model.js';
import { Lot } from './lot.model.js';
import { Winner } from './winner.model.js';
import { OrganizationAuction } from './organizationAuction.model.js';
import { AuctionShareLink } from './auctionShareLink.model.js';

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

Staff.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Staff, { foreignKey: 'user_id', as: 'staffProfile' });

Staff.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(Staff, { foreignKey: 'role_id', as: 'staffMembers' });

Staff.belongsTo(Staff, { foreignKey: 'created_by_staff_id', as: 'createdByStaff' });
Staff.hasMany(Staff, { foreignKey: 'created_by_staff_id', as: 'createdStaffMembers' });

RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });

AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });

AuditLog.belongsTo(Staff, { foreignKey: 'staff_id', as: 'staff' });
Staff.hasMany(AuditLog, { foreignKey: 'staff_id', as: 'auditLogs' });

KYCVerification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(KYCVerification, { foreignKey: 'user_id', as: 'kycVerification' });

KYCVerification.belongsTo(Staff, { foreignKey: 'reviewed_by_staff_id', as: 'reviewedByStaff' });
Staff.hasMany(KYCVerification, { foreignKey: 'reviewed_by_staff_id', as: 'reviewedKYCs' });

Staff.hasMany(Auction, { foreignKey: 'created_by_staff_id', as: 'createdAuctions' });
Auction.belongsTo(Staff, { foreignKey: 'created_by_staff_id', as: 'createdByStaff' });

User.hasOne(AssetOwner, { foreignKey: 'user_id', as: 'assetOwnerProfile' });
AssetOwner.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

AssetOwner.hasMany(Asset, { foreignKey: 'asset_owner_id', as: 'assets' });
Asset.belongsTo(AssetOwner, { foreignKey: 'asset_owner_id', as: 'assetOwner' });

Staff.hasMany(Asset, { foreignKey: 'reviewed_by_staff_id', as: 'reviewedAssets' });
Asset.belongsTo(Staff, { foreignKey: 'reviewed_by_staff_id', as: 'reviewedByStaff' });

Auction.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
Asset.hasOne(Auction, { foreignKey: 'asset_id', as: 'auction' });

Auction.hasMany(AuctionAsset, { foreignKey: 'auction_id', as: 'auctionAssets' });
AuctionAsset.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
AuctionAsset.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
Asset.hasMany(AuctionAsset, { foreignKey: 'asset_id', as: 'auctionLots' });

Lot.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
Auction.hasMany(Lot, { foreignKey: 'auction_id', as: 'lots' });
Lot.hasMany(AuctionAsset, { foreignKey: 'lot_id', as: 'auctionAssets' });
AuctionAsset.belongsTo(Lot, { foreignKey: 'lot_id', as: 'lot' });

Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

Evaluation.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
Asset.hasOne(Evaluation, { foreignKey: 'asset_id', as: 'evaluation' });
Evaluation.belongsTo(Staff, { foreignKey: 'evaluated_by_staff_id', as: 'evaluatedByStaff' });
Staff.hasMany(Evaluation, { foreignKey: 'evaluated_by_staff_id', as: 'evaluations' });

Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
Auction.hasMany(Payment, { foreignKey: 'auction_id', as: 'payments' });
Payment.belongsTo(Staff, { foreignKey: 'verified_by_staff_id', as: 'verifiedByStaff' });
Staff.hasMany(Payment, { foreignKey: 'verified_by_staff_id', as: 'verifiedPayments' });

Cpo.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Cpo, { foreignKey: 'user_id', as: 'cpos' });
Cpo.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
Auction.hasMany(Cpo, { foreignKey: 'auction_id', as: 'cpos' });
Cpo.belongsTo(Staff, { foreignKey: 'reviewed_by_staff_id', as: 'reviewedByStaff' });
Staff.hasMany(Cpo, { foreignKey: 'reviewed_by_staff_id', as: 'reviewedCpos' });
Cpo.hasMany(CpoPayment, { foreignKey: 'cpo_id', as: 'cpoPayments' });

CpoPayment.belongsTo(Cpo, { foreignKey: 'cpo_id', as: 'cpo' });
CpoPayment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
CpoPayment.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
CpoPayment.belongsTo(Staff, { foreignKey: 'verified_by_staff_id', as: 'verifiedByStaff' });

Bid.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Bid, { foreignKey: 'user_id', as: 'bids' });
Bid.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
Auction.hasMany(Bid, { foreignKey: 'auction_id', as: 'bids' });
Bid.belongsTo(AuctionAsset, { foreignKey: 'auction_asset_id', as: 'auctionAsset' });
AuctionAsset.hasMany(Bid, { foreignKey: 'auction_asset_id', as: 'bids' });

BidDraft.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(BidDraft, { foreignKey: 'user_id', as: 'bidDrafts' });
BidDraft.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
Auction.hasMany(BidDraft, { foreignKey: 'auction_id', as: 'bidDrafts' });
BidDraft.belongsTo(AuctionAsset, { foreignKey: 'auction_asset_id', as: 'auctionAsset' });
AuctionAsset.hasMany(BidDraft, { foreignKey: 'auction_asset_id', as: 'bidDrafts' });
BidDraft.belongsTo(Cpo, { foreignKey: 'cpo_id', as: 'cpo' });
Cpo.hasMany(BidDraft, { foreignKey: 'cpo_id', as: 'bidDrafts' });

Winner.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
Auction.hasMany(Winner, { foreignKey: 'auction_id', as: 'winners' });
Winner.belongsTo(Bid, { foreignKey: 'bid_id', as: 'winningBid' });
Bid.hasOne(Winner, { foreignKey: 'bid_id', as: 'winner' });
Winner.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Winner, { foreignKey: 'user_id', as: 'wins' });
Winner.belongsTo(Staff, { foreignKey: 'selected_by_staff_id', as: 'selectedByStaff' });
Staff.hasMany(Winner, { foreignKey: 'selected_by_staff_id', as: 'selectedWinners' });
Winner.belongsTo(AuctionAsset, { foreignKey: 'auction_asset_id', as: 'auctionAsset' });
AuctionAsset.hasMany(Winner, { foreignKey: 'auction_asset_id', as: 'winners' });

// Organization <-> Auction direct linkage
OrganizationAuction.belongsTo(User, { foreignKey: 'organization_user_id', as: 'organization' });
User.hasMany(OrganizationAuction, { foreignKey: 'organization_user_id', as: 'organizationAuctionLinks' });

OrganizationAuction.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
Auction.hasMany(OrganizationAuction, { foreignKey: 'auction_id', as: 'organizationAuctionLinks' });

OrganizationAuction.belongsTo(Staff, { foreignKey: 'linked_by_staff_id', as: 'linkedByStaff' });
Staff.hasMany(OrganizationAuction, { foreignKey: 'linked_by_staff_id', as: 'organizationAuctionLinks' });

// Auction share links
AuctionShareLink.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });
Auction.hasMany(AuctionShareLink, { foreignKey: 'auction_id', as: 'shareLinks' });
AuctionShareLink.belongsTo(Staff, { foreignKey: 'created_by_staff_id', as: 'creator' });
Staff.hasMany(AuctionShareLink, { foreignKey: 'created_by_staff_id', as: 'createdShareLinks' });

export {
  User,
  Role,
  Staff,
  RefreshToken,
  AuditLog,
  KYCVerification,
  Auction,
  AuctionAsset,
  AssetOwner,
  Asset,
  Notification,
  SystemSetting,
  Evaluation,
  Payment,
  Cpo,
  CpoPayment,
  Bid,
  BidDraft,
  Lot,
  Winner,
  OrganizationAuction,
  AuctionShareLink,
};

export default {
  User,
  Role,
  Staff,
  RefreshToken,
  AuditLog,
  KYCVerification,
  Auction,
  AuctionAsset,
  AssetOwner,
  Asset,
  Notification,
  SystemSetting,
  Evaluation,
  Payment,
  Cpo,
  CpoPayment,
  Bid,
  BidDraft,
  Lot,
  Winner,
  OrganizationAuction,
  AuctionShareLink,
};
