import jwt from "jsonwebtoken";
export const generateRandomPassword = (length = 12) => {
  const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerCase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+[]{}|;:,.<>?";

  const allCharacters = upperCase + lowerCase + numbers + specialChars;
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allCharacters.length);
    password += allCharacters[randomIndex];
  }

  return password;
};
export const getToken = async (user: any) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }
  const token = jwt.sign({ identifier: user._id }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
  return token;
};
export const getContentType = (ext: string) => {
  switch (ext.toLowerCase()) {
    // Image formats
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".bmp":
      return "image/bmp";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".tiff":
    case ".tif":
      return "image/tiff";

    // Video formats
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".avi":
      return "video/x-msvideo";
    case ".mkv":
      return "video/x-matroska";
    case ".webm":
      return "video/webm";
    case ".flv":
      return "video/x-flv";

    // Audio formats
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".flac":
      return "audio/flac";
    case ".aac":
      return "audio/aac";
    case ".m4a":
      return "audio/x-m4a";

    // Document formats
    case ".pdf":
      return "application/pdf";
    case ".doc":
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".ppt":
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case ".txt":
      return "text/plain";
    case ".csv":
      return "text/csv";
    case ".json":
      return "application/json";
    case ".xml":
      return "application/xml";

    // Compressed formats
    case ".zip":
      return "application/zip";
    case ".rar":
      return "application/x-rar-compressed";
    case ".7z":
      return "application/x-7z-compressed";
    case ".tar":
      return "application/x-tar";
    case ".gz":
      return "application/gzip";

    // Executable formats
    case ".exe":
      return "application/vnd.microsoft.portable-executable";
    case ".sh":
      return "application/x-sh";
    case ".bat":
      return "application/x-bat";

    // Default (binary stream if unknown)
    default:
      return "application/octet-stream";
  }
};
