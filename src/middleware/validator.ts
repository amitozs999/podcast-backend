import { RequestHandler } from "express";
import * as yup from "yup";

export const validate = (schema: any): RequestHandler => {
  return async (req, res, next) => {
    if (!req.body)
      return res.status(422).json({ error: "Empty body is not excepted!" });

    const schemaToValidateWith = yup.object({
      body: schema,
    });

    try {
      await schemaToValidateWith.validate(
        {
          body: req.body, //ye req body ko validate with  schema jo passed je usese
        },
        {
          abortEarly: true,
        }
      );

      next();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        res.status(422).json({ error: error.message });
      }
    }
  };
};
