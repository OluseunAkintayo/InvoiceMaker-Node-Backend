import dayjs from "dayjs";
import { db } from "../db";
import { collections } from "../db/collections";
import { IAuthService, IGoogleUser, ILoginResponse, IUserDto } from "../lib/types";
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { redis } from "../lib/redis";

class AuthService implements IAuthService {
  constructor() {}

  async signup(userDto: IUserDto) {
    const users = db?.collection(collections.users);
    const duplicate_user = await users?.findOne({ email: userDto.email });
    if (duplicate_user) {
      return {
        success: false,
        message: `User with the email ${userDto.email} already exists. Please login instead`
      }
    }

    const salt_rounds = 12;
    const salt = await bcrypt.genSalt(salt_rounds);
    const hashed_password = await bcrypt.hash(userDto.passcode, salt);
    const user_to_insert = {
      display_name: "",
      username: userDto.email,
      email: userDto.email,
      passcode: hashed_password,
      created_at: new Date().toISOString(),
      modifedAt: null
    }

    try {
      const user = await users?.insertOne(user_to_insert);
      return {
        success: true,
        message: "Signup successful",
        data: user
      }
    } catch (error) {
      return {
        success: false,
        message: "Error connecting to DB",
      }
    }
  }


  async googleAuth(credentials: string) {
    const users = db?.collection(collections.users);
    const user = jwt.decode(credentials) as IGoogleUser;
    try {
      const duplicate_user = await users?.findOne({ email: user.email });
      if (duplicate_user) {
        const { _id, email } = duplicate_user
        const token = jsonwebtoken.sign(
          { id: _id?.toString(), email: email, exp: Date.parse(dayjs().add(1, 'hour').toISOString()) },
          process?.env?.CRYPTO_KEY!,
          { algorithm: 'HS512' },
        );
        const data: ILoginResponse = {
          access_token: token,
          expiration: dayjs().add(1, 'day').toISOString(),
          user: {
            id: _id.toString(),
            email: email,
            picture: user.picture
          }
        }
        return { success: true, data }
      }
    } catch (error) {
      return {
        success: false,
        message: "A DB error has occurred",
      }
    }


    const user_to_insert = {
      display_name: user.name,
      username: user.email,
      email: user.email,
      mode: 'oauth',
      created_at: new Date().toISOString(),
      modifeed_at: null,
    }

    try {
      const new_user = await users?.insertOne(user_to_insert);
      const _id = new_user?.insertedId;
      const token = jsonwebtoken.sign(
        { id: _id?.toString(), email: user.email, exp: Date.parse(dayjs().add(1, 'hour').toISOString()) },
        process?.env?.CRYPTO_KEY!,
        { algorithm: 'HS512' },
      );
      const data: ILoginResponse = {
        access_token: token,
        expiration: dayjs().add(1, 'day').toISOString(),
        user: {
          id: _id?.toString() ?? '',
          email: user.email
        }
      }
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        message: "Error connecting to DB",
      }
    }
  }

  async login(userDto: IUserDto) {
    const users = db?.collection(collections.users);
    try {
      const user = await users?.findOne({ email: userDto.email });
      if (user) {
        if (await bcrypt.compare(userDto.passcode, user.passcode)) {
          const { _id, email } = user;
          const token = jsonwebtoken.sign(
            { id: _id.toString(), email, exp: Date.parse(dayjs().add(1, 'hour').toISOString()) },
            process?.env?.CRYPTO_KEY!,
            { algorithm: 'HS512' },
          );
          const data: ILoginResponse = {
            access_token: token,
            expiration: dayjs().add(1, 'day').toISOString(),
            user: {
              id: _id.toString(),
              email: user.email,
              picture: user.picture
            }
          }
          return { success: true, data }
        }
        return { success: false, message: "Email or password is incorrect" }
      }
      return {
        success: false,
        message: "Email or password is incorrect"
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  async logout(token: string) {
    if (process.env.CRYPTO_KEY) {
      const decoded_token = jwt.verify(token, process.env.CRYPTO_KEY) as { id: string; email: string; exp: number, iat: number };
      const exp = decoded_token.exp;
      const remaining_time = exp - new Date().getTime();
      if (remaining_time > 0) {
        await redis.set(token, "invalidated", "PX", remaining_time);
      }
      return { success: true, message: "User logged out" };
    }
    return { success: false, message: "Unable to decode token" };
  }

  async getOtp(email: string) {
    const users = db?.collection(collections.users);

    const user = await users?.findOne({ email: email });
    const transporter = nodemailer.createTransport({
      host: process.env.MAILER_HOST,
      port: 587,
      // secure: true,
      auth: {
        user: process.env.MAILER_ID,
        pass: process.env.MAILER_PASS
      }
    });
  }

  async validateOtp(code: string) { }

  async resetPassword(email: string) { }

}

export default AuthService;