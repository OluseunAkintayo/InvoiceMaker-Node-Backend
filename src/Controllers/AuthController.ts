import { Request, Response, Router } from "express";
import bcrypt from 'bcrypt';
import { ILoginResponse, IUser, IUserDto } from "../lib/types";
import { db } from '../db';
import jsonwebtoken from 'jsonwebtoken';
import dayjs from "dayjs";
import nodemailer from 'nodemailer';
import UserSchema from "../Models/User";

const AuthController = Router();


AuthController.post("/signup", async (req: Request, res: Response) => {
  const userDto: IUserDto = req.body;
  const users = db?.collection("users");
  const duplicate_user = await users?.findOne({ email: userDto.email });
  if (duplicate_user) {
    res.status(400).json({
      success: false,
      message: `User with the email ${userDto.email} already exists. Please login instead`
    });
    return;
  }

  const salt_rounds = 16;
  const salt = await bcrypt.genSalt(salt_rounds);
  const hashed_password = await bcrypt.hash(userDto.passcode, salt);
  const user_to_insert = {
    display_name: "",
    username: userDto.email,
    email: userDto.email,
    passcode: hashed_password,
    created_at: new Date().toISOString(),
    modifed_at: null
  }

  // const validateSchema = await UserSchema.validate(user_to_insert);

  // res.json({ schema_result: validateSchema });

  const user = await users?.insertOne(user_to_insert);
  res.status(201).json({
    success: true,
    message: "Signup successful",
    data: user
  });
});


AuthController.post("/login", async (req: Request, res: Response) => {
  const userDto = req.body as IUserDto;
  const users = db?.collection("users");
  const user = await users?.findOne({ email: userDto.email });
  if (user) {
    if (await bcrypt.compare(userDto.passcode, user.passcode)) {
      const { _id, email } = user;
      const token = jsonwebtoken.sign(
        { id: _id, email },
        process?.env?.CRYPTO_KEY!,
        { algorithm: 'HS512', expiresIn: '1h' },
      );
      const data: ILoginResponse = {
        access_token: token,
        expiration: dayjs().add(1, 'hour').toISOString(),
        user: {
          id: _id.toString(),
        }
      }
      res.status(200).json({ data });
    } else {
      res.json({ success: false, message: "Email or password is incorrect" });
    }
    return;
  }
  res.status(400).json({
    success: false,
    message: "Email or password is incorrect"
  });
});

// to be continued
AuthController.get("/get-otp", async (req: Request, res: Response) => {
  const email = req.query.email;
  const users = db?.collection("users");
  if (email) {
    const user = await users?.findOne({ email: email });
    const transporter = nodemailer.createTransport({
      host: process.env.MAILER_HOST,
      port: 587,
      // secure: true,
      auth: {
        user: process.env.MAILER_ID,
        pass: process.env.MAILER_PASS
      }
    })
    res.json({ user });
  }
});

AuthController.post("/validate-otp", async (req: Request, res: Response) => { });

AuthController.post("/reset-password", async (req: Request, res: Response) => { });

export default AuthController;
