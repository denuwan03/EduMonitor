const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");

const USER_ID_PREFIX = "USR";
const USER_ID_PAD = 4;

const generateUserId = async () => {
  const latestUser = await User.findOne({ userId: { $exists: true, $ne: null } })
    .sort({ userId: -1 })
    .select("userId");

  if (!latestUser?.userId) {
    return `${USER_ID_PREFIX}${String(1).padStart(USER_ID_PAD, "0")}`;
  }

  const current = Number(latestUser.userId.replace(USER_ID_PREFIX, "")) || 0;
  const next = current + 1;
  return `${USER_ID_PREFIX}${String(next).padStart(USER_ID_PAD, "0")}`;
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, skills, profile } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (skills) user.skills = skills;
    if (profile) user.profile = { ...user.profile, ...profile };
    user.activityLog.push({ action: "Updated profile" });
    await user.save();
    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

exports.getStudents = async (_req, res, next) => {
  try {
    const students = await User.find({ role: "Student" }).select("-password");
    return res.json(students);
  } catch (error) {
    return next(error);
  }
};

exports.getUserActivity = async (_req, res, next) => {
  try {
    const users = await User.find().select("name role activityLog");
    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const myTasks = await Task.find(req.user.role === "Student" ? { assignedTo: req.user._id } : {});
    const completed = myTasks.filter((task) => task.status === "Completed").length;
    const pending = myTasks.length - completed;
    return res.json({ totalTasks: myTasks.length, completed, pending });
  } catch (error) {
    return next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, role, password, status } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: "Name, email, role, and password are required" });
    }

    if (!["Student", "Supervisor"].includes(role)) {
      return res.status(400).json({ message: "Role must be Student or Supervisor" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const userId = await generateUserId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId,
      name,
      email: email.toLowerCase(),
      role,
      password: hashedPassword,
      createdBy: req.user._id,
      status: status === "Inactive" ? "Inactive" : "Active",
      activityLog: [{ action: `Account created by admin ${req.user.name}` }],
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdBy: user.createdBy,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role && ["Admin", "Supervisor", "Student"].includes(role)) {
      query.role = role;
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { email: regex }, { userId: regex }];
    }

    const users = await User.find(query)
      .select("-password")
      .populate("createdBy", "name email userId")
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (role && ["Admin", "Supervisor", "Student"].includes(role)) user.role = role;
    if (status && ["Active", "Inactive"].includes(status)) user.status = status;

    user.activityLog.push({ action: `Account updated by admin ${req.user.name}` });
    await user.save();

    return res.json({
      message: "User updated successfully",
      user: await User.findById(user._id).select("-password").populate("createdBy", "name email userId"),
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Admin cannot delete own account" });
    }

    await user.deleteOne();
    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

exports.resetUserPassword = async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ message: "userId and password are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    user.activityLog.push({ action: `Password reset by admin ${req.user.name}` });
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    return next(error);
  }
};
