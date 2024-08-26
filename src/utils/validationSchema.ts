import * as yup from "yup";

export const CreateUserSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required("Name is missing!")
    .min(3, "Name is too short!")
    .max(20, "Name is too long!"),
  email: yup.string().required("Email is missing!").email("Invalid email id!"),
  password: yup
    .string()
    .trim()
    .required("Password is missing!")
    .min(8, "Password is too short!")
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      "Password is too simple!"
    ),
});

export const EmailVerificationBodySchema = yup.object().shape({
  token: yup.string().trim().required("Invalid token!"),
  userId: yup
    .string()
    .transform(function (value) {
      if (this.isType(value)) {
        return value;
      }
      return "";
    })
    .required("Invalid userId!"),
});

export const TokenAndIDValidation = yup.object().shape({
  token: yup.string().trim().required("Invalid token!"),
  userId: yup
    .string()
    .transform(function (value) {
      if (this.isType(value)) {
        return value;
      }
      return "";
    })
    .required("Invalid userId!"),
});

export const UpdatePasswordSchema = yup.object().shape({
  token: yup.string().trim().required("Invalid token!"),
  userId: yup
    .string()
    .transform(function (value) {
      if (this.isType(value)) {
        return value;
      }
      return "";
    })
    .required("Invalid userId!"),
  password: yup
    .string()
    .trim()
    .required("Password is missing!")
    .min(8, "Password is too short!")
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      "Password is too simple!"
    ),
});

export const SignInValidationSchema = yup.object().shape({
  email: yup.string().required("Email is missing!").email("Invalid email id!"),
  password: yup.string().trim().required("Password is missing!"),
});

export const categories = [
  "Arts",
  "Business",
  "Education",
  "Entertainment",
  "Kids & Family",
  "Music",
  "Science",
  "Tech",
  "Others",
];

export const AudioValidationSchema = yup.object().shape({
  title: yup.string().required("Title is missing!"),
  about: yup.string().required("About is missing!"),
  category: yup
    .string()
    .oneOf(categories, "Invalid category!")
    .required("Category is missing!"),
});
