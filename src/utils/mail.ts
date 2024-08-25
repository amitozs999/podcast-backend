import nodemailer from "nodemailer";
import path from "path";

// import User from "#/models/user";
// import EmailVerificationToken from "#/models/emailVerificationToken";
import {
  MAILTRAP_PASS,
  MAILTRAP_USER,
  VERIFICATION_EMAIL,
  SIGN_IN_URL,
} from "#/utils/variables";
import { generateToken } from "./helper";
import { generateTemplate } from "#/mail/template";

const generateMailTransporter = () => {
  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: MAILTRAP_USER,
      pass: MAILTRAP_PASS,
    },
  });

  return transport;
};

interface Profile {
  name: string;
  email: string;
  userId: string;
}

export const sendVerificationMail = async (token: string, profile: Profile) => {
  console.log("kk1");
  const transport = generateMailTransporter();
  console.log("kk2");

  const { name, email, userId } = profile;
  console.log("kk31" + name + email);

  const welcomeMessage = `Hi ${name}, welcome to Podcasr!  Use the OTP to verify your email.`;

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Welcome message",
    html: generateTemplate({
      title: "Welcome to Podify",
      message: welcomeMessage,
      logo: "cid:logo",
      banner: "cid:welcome",
      link: "#",
      btnTitle: token,
    }),

    // attachments: [
    //   {
    //     filename: "logo.png",
    //     path: path.join(__dirname, "../mail/logo.png"),
    //     cid: "logo",
    //   },
    //   {
    //     filename: "welcome.png",
    //     path: path.join(__dirname, "../mail/welcome.png"),
    //     cid: "welcome",
    //   },
    // ],
  });
};

interface Options {
  email: string;
  link: string;
}

export const sendForgetPasswordLink = async (options: Options) => {
  const transport = generateMailTransporter();

  const { email, link } = options;

  const message =
    "We just received a request that you forgot your password. No problem you can use the link below and create brand new password.";

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Reset Password Link",
    html: generateTemplate({
      title: "Forget Password",
      message,
      logo: "cid:logo",
      banner: "cid:forget_password",
      link,
      btnTitle: "Reset Password",
    }),
    // attachments: [
    //   {
    //     filename: "logo.png",
    //     path: path.join(__dirname, "../mail/logo.png"),
    //     cid: "logo",
    //   },
    //   {
    //     filename: "forget_password.png",
    //     path: path.join(__dirname, "../mail/forget_password.png"),
    //     cid: "forget_password",
    //   },
    // ],
  });
};

export const sendPassResetSuccessEmail = async (
  name: string,
  email: string
) => {
  const transport = generateMailTransporter();

  const message = `Dear ${name} we just updated your new password. You can now sign in with your new password.`;

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Password Reset Successfully",
    html: generateTemplate({
      title: "Password Reset Successfully",
      message,
      logo: "cid:logo",
      banner: "cid:forget_password",
      link: SIGN_IN_URL,
      btnTitle: "Log in",
    }),
    // attachments: [
    //   {
    //     filename: "logo.png",
    //     path: path.join(__dirname, "../mail/logo.png"),
    //     cid: "logo",
    //   },
    //   {
    //     filename: "forget_password.png",
    //     path: path.join(__dirname, "../mail/forget_password.png"),
    //     cid: "forget_password",
    //   },
    // ],
  });
};
