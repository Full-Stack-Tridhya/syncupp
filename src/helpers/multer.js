const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Configuration = require("../models/configurationSchema");

let configure;
(async () => {
  configure = await Configuration.findOne().lean();
})();
function getTotalSize(files) {
  let totalSize = 0;
  for (const file of files) {
    totalSize += file.size;
  }
  return totalSize;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const img_dir = "src/public/uploads";
    if (!fs.existsSync(img_dir)) {
      fs.mkdirSync(img_dir, { recursive: true });
    }
    if (file?.mimetype?.startsWith("image/")) {
      cb(null, img_dir);
    } else if (file?.mimetype?.startsWith("application/pdf")) {
      cb(null, img_dir);
    } else if (
      file?.mimetype?.startsWith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) ||
      file?.mimetype?.startsWith("application/vnd.ms-excel")
    ) {
      cb(null, img_dir);
    } else if (file?.mimetype?.startsWith("video/")) {
      cb(null, img_dir);
    } else if (file?.mimetype?.startsWith("text/")) {
      cb(null, img_dir);
    } else if (file?.mimetype?.startsWith("text/csv")) {
      cb(null, img_dir);
    } else if (file?.mimetype?.startsWith("image/svg+xml")) {
      cb(null, img_dir);
    } else if (file?.mimetype?.startsWith("image/gif")) {
      cb(null, img_dir);
    } else if (file?.mimetype?.startsWith("application/x-rar-compressed")) {
      cb(null, img_dir);
    } else if (
      file?.mimetype?.startsWith(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) ||
      file?.mimetype?.startsWith("application/vnd.ms-powerpoint")
    ) {
      cb(null, img_dir);
    } else if (file?.mimetype === "application/zip") {
      cb(null, img_dir);
    } else if (
      file?.mimetype?.startsWith("application/msword") ||
      file?.mimetype?.startsWith(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ) {
      cb(null, img_dir);
    } else if (file?.mimetype === "audio/webm") {
      cb(null, img_dir);
    }
  },

  filename: (req, file, cb) => {
    const extension = file?.originalname?.split(".")?.pop();
    const fileName = Date.now() + "." + extension;
    req.fileName = fileName;
    req.originalname = file?.originalname || undefined;
    cb(null, fileName);
  },
});

const storage2 = multer.memoryStorage({
  destination: (req, file, cb) => {
    const img_dir = "src/public/uploads";
    if (!fs.existsSync(img_dir)) {
      fs.mkdirSync(img_dir, { recursive: true });
    }
    if (file.mimetype === "audio/webm") {
      cb(null, img_dir);
    }
  },

  filename: (req, file, cb) => {
    if (file.mimetype === "audio/webm") {
      const fs = require("fs");

      const blob = new Blob([new Uint8Array(file)]);
      const buffer = Buffer.from(blob);

      fs.writeFileSync("audio.wav", buffer);
    } else {
      const extension = file?.originalname?.split(".")?.pop();
      const fileName = Date.now() + "." + extension;
      req.fileName = fileName;

      cb(null, fileName);
    }
  },
});

// Multer config
const upload = multer({
  storage: storage,
  // limits: {
  //   fileSize: configure?.multer?.size || 200 * 1024 * 1024, // 200MB maximum file size
  // },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "audio/webm") {
      return cb(null, true);
    }
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".pdf",
      ".xls",
      ".xlsx",
      ".mp4",
      ".txt",
      ".ppt",
      ".pptx",
      ".zip",
      ".doc",
      ".docx",
      ".avi",
      ".avif",
      ".mov",
      ".wmv",
      ".flv",
      ".mkv",
      ".mpg",
      ".mpeg",
      ".mp2",
      ".3gp",
      ".webm",
      ".rar",
      ".csv",
      ".svg",
      ".gif",
      ".webp",
      ".raw",
      ".psd",
      ".heif",
      ".heic",
      ".tiff",
      ".tif",
      ".bmp",
    ];

    const fileExt = path.extname(file?.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      const error = new Error(
        `Only ${allowedExtensions.join(" ")} files are allowed.`
      );
      error.status = 400;
      error.code = "FILE_FORMAT_NOT_MATCH";
      return cb(error);
    }

    cb(null, true);
  },
});

// Multer for upload audio
const audio_upload = multer({
  storage: storage2,
  limits: {
    fileSize: configure?.multer?.size || 200 * 1024 * 1024, // 200MB maximum file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "audio/webm") {
      return cb(null, true);
    }
  },
});

// Middleware to check total file size before uploading
const checkFileSize = async (req, res, next) => {
  const maxSize = await Configuration.findOne({}).lean();
  const limit = parseInt(maxSize?.multer?.size) * 1024 * 1024;
  if (
    !req.headers["content-length"] ||
    parseInt(req.headers["content-length"]) > limit
  ) {
    const error = Error(
      `Profile file size exceeds ${maxSize?.multer?.size}MB limit or no file provided`
    );
    error.status = 400;
    return next(error);
  }
  next();
};

// Middleware to check Profile file size before uploading
const checkProfileSize = async (req, res, next) => {
  const maxSize = await Configuration.findOne({}).lean();
  const limit = parseInt(maxSize?.multer?.profileSize) * 1024 * 1024;
  if (
    !req.headers["content-length"] ||
    parseInt(req.headers["content-length"]) > limit
  ) {
    const error = Error(
      `Profile file size exceeds ${maxSize?.multer?.profileSize}MB limit or no file provided`
    );
    error.status = 400;
    return next(error);
  }
  next();
};
module.exports = { upload, checkFileSize, audio_upload, checkProfileSize };
