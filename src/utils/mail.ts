import nodemailer from "nodemailer";
import path from "path";

// import User from "#/models/user";
// import EmailVerificationToken from "#/models/emailVerificationToken";
import {
  MAILTRAP_PASS,
  MAILTRAP_USER,
  VERIFICATION_EMAIL,
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
