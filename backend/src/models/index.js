import { User } from './user.model.js';
import { Role } from './role.model.js';
import { Staff } from './staff.model.js';
import { RefreshToken } from './refreshToken.model.js';
import { AuditLog } from './auditLog.model.js';
import { KYCVerification } from './kyc.model.js';

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

Staff.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Staff, { foreignKey: 'user_id', as: 'staffProfile' });

Staff.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(Staff, { foreignKey: 'role_id', as: 'staffMembers' });

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

export {
  User,
  Role,
  Staff,
  RefreshToken,
  AuditLog,
  KYCVerification,
};

export default {
  User,
  Role,
  Staff,
  RefreshToken,
  AuditLog,
  KYCVerification,
};
