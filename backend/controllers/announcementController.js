const Announcement = require("../models/Announcement");

const canViewAnnouncement = (announcement, role) =>
  announcement.targetRole === "All" || announcement.targetRole === role;

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetRole, createdDate } = req.body;
    const announcement = await Announcement.create({
      title,
      message,
      targetRole: targetRole || "All",
      createdDate: createdDate || new Date(),
      createdBy: req.user._id,
      createdByRole: req.user.role,
    });
    return res.status(201).json(announcement);
  } catch (error) {
    return next(error);
  }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name userId")
      .sort({ createdDate: -1, createdAt: -1 });

    const visible = announcements.filter((item) => canViewAnnouncement(item, req.user.role));
    return res.json(visible);
  } catch (error) {
    return next(error);
  }
};

exports.getLatestAnnouncements = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 10);
    const announcements = await Announcement.find()
      .populate("createdBy", "name userId")
      .sort({ createdDate: -1, createdAt: -1 })
      .limit(20);

    const visible = announcements
      .filter((item) => canViewAnnouncement(item, req.user.role))
      .slice(0, limit);

    return res.json(visible);
  } catch (error) {
    return next(error);
  }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    if (!["Admin", "Supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    announcement.title = req.body.title ?? announcement.title;
    announcement.message = req.body.message ?? announcement.message;
    announcement.targetRole = req.body.targetRole ?? announcement.targetRole;
    announcement.updatedDate = new Date();

    await announcement.save();
    return res.json(announcement);
  } catch (error) {
    return next(error);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });
    await announcement.deleteOne();
    return res.json({ message: "Announcement deleted" });
  } catch (error) {
    return next(error);
  }
};
