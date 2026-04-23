const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "edumonitor-secret", { expiresIn: "1d" });

const ADMIN_CREDENTIALS = {
  name: "System Admin",
  email: "admin@edumonitor.com",
  password: "Admin@123",
};

const ensureHardcodedAdmin = async () => {
  const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email.toLowerCase() });
  if (existingAdmin) return existingAdmin;

  const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10);
  const adminUser = await User.create({
    userId: "USR0001",
    name: ADMIN_CREDENTIALS.name,
    email: ADMIN_CREDENTIALS.email.toLowerCase(),
    password: hashedPassword,
    role: "Admin",
    status: "Active",
    createdBy: null,
    activityLog: [{ action: "Hardcoded admin bootstrap account created" }],
  });

  return adminUser;
};

exports.register = async (req, res, next) => {
  try {
    await ensureHardcodedAdmin();
    return res.status(403).json({ message: "Self registration is disabled. Contact Admin." });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    await ensureHardcodedAdmin();

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status === "Inactive") return res.status(403).json({ message: "Account is inactive" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    user.activityLog.push({ action: "Logged in" });
    await user.save();
    return res.json({
      token: createToken(user._id),
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return next(error);
  }
};
