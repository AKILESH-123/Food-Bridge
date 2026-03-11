const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/db');
const { User, Donation } = require('../models/index');

// @desc    Get public-facing platform stats
// @route   GET /api/stats/public
exports.getStats = async (req, res) => {
  try {
    const [totalDonors, totalNGOs, totalDonations, completedDonations, activeDonations, mealStats] =
      await Promise.all([
        User.count({ where: { role: 'donor', isActive: true } }),
        User.count({ where: { role: 'ngo', isActive: true } }),
        Donation.count(),
        Donation.count({ where: { status: 'completed' } }),
        Donation.count({ where: { status: { [Op.in]: ['available', 'requested', 'assigned'] } } }),
        Donation.findOne({
          where: { status: 'completed' },
          attributes: [
            [fn('SUM', col('estimatedServings')), 'totalServings'],
            [fn('SUM', col('quantity')), 'totalQty'],
          ],
          raw: true,
        }),
      ]);

    const totalMealsSaved = Number(mealStats?.totalServings) || 0;
    const totalFoodSaved = Number(mealStats?.totalQty) || 0;
    const co2Saved = (totalFoodSaved * 2.5).toFixed(1);

    res.json({
      success: true,
      stats: {
        totalDonors, totalNGOs, totalDonations, completedDonations, activeDonations,
        totalMealsSaved, totalFoodSaved, co2Saved,
        completionRate: totalDonations > 0 ? ((completedDonations / totalDonations) * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch platform stats' });
  }
};

// @desc    Donor-specific stats
// @route   GET /api/stats/donor
exports.getDonorStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, completed, active, impactData, recentDonations, user] = await Promise.all([
      Donation.count({ where: { donorId: userId } }),
      Donation.count({ where: { donorId: userId, status: 'completed' } }),
      Donation.count({ where: { donorId: userId, status: { [Op.in]: ['available', 'requested', 'assigned'] } } }),
      Donation.findOne({
        where: { donorId: userId, status: 'completed' },
        attributes: [
          [fn('SUM', col('estimatedServings')), 'totalServings'],
          [fn('SUM', col('quantity')), 'totalKg'],
        ],
        raw: true,
      }),
      Donation.findAll({
        where: { donorId: userId },
        include: [{ model: User, as: 'requestedBy', attributes: ['id', 'name', 'organizationName'] }],
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
      User.findByPk(userId, { attributes: ['impactPoints'] }),
    ]);

    res.json({
      success: true,
      stats: {
        totalDonations: total,
        completedDonations: completed,
        activeDonations: active,
        impactPoints: user?.impactPoints || 0,
        mealsSaved: Number(impactData?.totalServings) || 0,
        foodSavedKg: Number(impactData?.totalKg) || 0,
        co2Saved: ((Number(impactData?.totalKg) || 0) * 2.5).toFixed(1),
        recentDonations,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch donor stats' });
  }
};

// @desc    NGO-specific stats
// @route   GET /api/stats/ngo
exports.getNGOStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalPickups, completed, active, impactData, recentPickups, user] = await Promise.all([
      Donation.count({ where: { [Op.or]: [{ requestedById: userId }, { assignedToId: userId }] } }),
      Donation.count({ where: { assignedToId: userId, status: 'completed' } }),
      Donation.count({ where: { [Op.or]: [{ requestedById: userId }, { assignedToId: userId }], status: { [Op.in]: ['requested', 'assigned'] } } }),
      Donation.findOne({
        where: { assignedToId: userId, status: 'completed' },
        attributes: [[fn('SUM', col('estimatedServings')), 'totalServings']],
        raw: true,
      }),
      Donation.findAll({
        where: { [Op.or]: [{ requestedById: userId }, { assignedToId: userId }] },
        include: [{ model: User, as: 'donor', attributes: ['id', 'name', 'organizationName', 'city'] }],
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
      User.findByPk(userId, { attributes: ['impactPoints', 'mealsProvided'] }),
    ]);

    res.json({
      success: true,
      stats: {
        totalPickups,
        completedPickups: completed,
        activePickups: active,
        impactPoints: user?.impactPoints || 0,
        peopleFed: Number(impactData?.totalServings) || user?.mealsProvided || 0,
        recentPickups,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch NGO stats' });
  }
};

// @desc    Admin full analytics
// @route   GET /api/stats/admin
exports.getAdminStats = async (req, res) => {
  try {
    const [totalDonations, completedDonations, usersByRole, byCategory, byCity, monthly, recentUsers, recentDonations] =
      await Promise.all([
        Donation.count(),
        Donation.count({ where: { status: 'completed' } }),

        // Users grouped by role
        User.findAll({
          attributes: ['role', [fn('COUNT', col('id')), 'count']],
          group: ['role'],
          raw: true,
        }),

        // Donations grouped by category
        Donation.findAll({
          attributes: ['category', [fn('COUNT', col('id')), 'count']],
          group: ['category'],
          order: [[literal('count'), 'DESC']],
          raw: true,
        }),

        // Donations grouped by city (top 10)
        Donation.findAll({
          attributes: ['pickupCity', [fn('COUNT', col('id')), 'count']],
          group: ['pickupCity'],
          order: [[literal('count'), 'DESC']],
          limit: 10,
          raw: true,
        }),

        // Monthly donations (last 12 months)
        sequelize.query(
          `SELECT 
            YEAR(createdAt) AS year,
            MONTH(createdAt) AS month,
            COUNT(*) AS count,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
          FROM donations
          GROUP BY YEAR(createdAt), MONTH(createdAt)
          ORDER BY year DESC, month DESC
          LIMIT 12`,
          { type: sequelize.QueryTypes.SELECT }
        ),

        User.findAll({
          attributes: ['id', 'name', 'email', 'role', 'city', 'isVerified', 'isActive', 'impactPoints', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 5,
        }),

        Donation.findAll({
          include: [{ model: User, as: 'donor', attributes: ['id', 'name', 'organizationName'] }],
          order: [['createdAt', 'DESC']],
          limit: 5,
        }),
      ]);

    const formattedUsersByRole = usersByRole.map((r) => ({ _id: r.role, count: Number(r.count) }));
    const formattedByCategory = byCategory.map((r) => ({ _id: r.category, count: Number(r.count) }));
    const formattedByCity = byCity.map((r) => ({ _id: r.pickupCity, count: Number(r.count) }));
    const formattedMonthly = [...monthly].reverse().map((r) => ({
      _id: { year: r.year, month: r.month },
      count: Number(r.count),
      completed: Number(r.completed),
    }));

    const serializedUsers = recentUsers.map((u) => { const o = u.toJSON(); o._id = o.id; return o; });
    const serializedDonations = recentDonations.map((d) => {
      const o = d.toJSON(); o._id = o.id;
      if (o.donor) o.donor._id = o.donor.id;
      return o;
    });

    res.json({
      success: true,
      stats: {
        usersByRole: formattedUsersByRole,
        totalDonations,
        completedDonations,
        byCategory: formattedByCategory,
        byCity: formattedByCity,
        monthly: formattedMonthly,
        recentUsers: serializedUsers,
        recentDonations: serializedDonations,
      },
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
};
