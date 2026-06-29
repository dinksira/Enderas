'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = async (name) => {
      try {
        await queryInterface.describeTable(name);
        return true;
      } catch {
        return false;
      }
    };

    if (!(await tableExists('winners'))) {
      await queryInterface.createTable('winners', {
        id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
        },
        auction_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },
        bid_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          unique: true,
        },
        user_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },
        selected_by_staff_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },
        selected_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        status: {
          type: Sequelize.ENUM('pending_confirmation', 'confirmed', 'declined', 'replaced'),
          allowNull: false,
          defaultValue: 'pending_confirmation',
        },
        selection_method: {
          type: Sequelize.ENUM('auto', 'manual'),
          allowNull: false,
          defaultValue: 'manual',
        },
        decline_reason: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        declined_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        notification_sent_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      });

      await queryInterface.addIndex('winners', ['auction_id']);
      await queryInterface.addIndex('winners', ['user_id']);
      await queryInterface.addIndex('winners', ['status']);
      return;
    }

    const columns = await queryInterface.describeTable('winners');

    if (columns.auction_id?.unique) {
      try {
        await queryInterface.removeConstraint('winners', 'auction_id');
      } catch {
        try {
          await queryInterface.removeIndex('winners', 'auction_id');
        } catch {
          // ignore — index name may differ
        }
      }
    }

    if (!columns.selection_method) {
      await queryInterface.addColumn('winners', 'selection_method', {
        type: Sequelize.ENUM('auto', 'manual'),
        allowNull: false,
        defaultValue: 'manual',
      });
    }

    if (!columns.declined_at) {
      await queryInterface.addColumn('winners', 'declined_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    try {
      await queryInterface.addIndex('winners', ['auction_id'], { name: 'winners_auction_id_idx' });
    } catch {
      // index may already exist
    }
  },

  async down(queryInterface) {
    const tableExists = async (name) => {
      try {
        await queryInterface.describeTable(name);
        return true;
      } catch {
        return false;
      }
    };

    if (!(await tableExists('winners'))) {
      return;
    }

    const columns = await queryInterface.describeTable('winners');
    if (columns.selection_method) {
      await queryInterface.removeColumn('winners', 'selection_method');
    }
    if (columns.declined_at) {
      await queryInterface.removeColumn('winners', 'declined_at');
    }
  },
};
