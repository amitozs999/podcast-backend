import { Request, RequestHandler } from "express";
import formidable, { File } from "formidable";

export interface RequestWithFiles extends Request {
  files?: { [key: string]: File };
}

const fileParser: RequestHandler = async (req: RequestWithFiles, res, next) => {
  if (!req.headers["content-type"]?.startsWith("multipart/form-data;"))
    return res.status(422).json({ error: "Only accepts form-data!" });

  const form = formidable({ multiples: false });

  const [fields, files] = await form.parse(req);

  for (let key in fields) {
    const field = fields[key];
    if (field) {
      req.body[key] = field[0];
    }
  }

  for (let key in files) {
    const file = files[key] as File[];

    if (!req.files) {
      req.files = {};
    }

    if (file) {
      // Ensure req.files is an object
      if (Array.isArray(file)) {
        req.files[key] = file[0]; // Use the first file if multiple are provided
      } else {
        req.files[key] = file; // Single file case
      }
    }
  }

  next();
};

export default fileParser;
