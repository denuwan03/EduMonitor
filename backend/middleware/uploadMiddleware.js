const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".zip"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) return cb(null, true);
  return cb(new Error("Only PDF, DOC, DOCX, ZIP files allowed"));
};

module.exports = multer({ storage, fileFilter });
