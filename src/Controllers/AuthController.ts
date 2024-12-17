import { Request, Response, Router } from "express";
import { IUserDto } from "../lib/types";
import { checkToken } from "../lib/checkToken";
import AuthService from "../Services/AuthService";

const AuthController = Router();
const authService = new AuthService();

AuthController.post("/signup", async (req: Request, res: Response) => {
  const userDto: IUserDto = req.body;
  try {
    const response = await authService.signup(userDto);
    if (response.success) {
      res.status(200).json(response);
      return
    }
    res.status(400).json(response);
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});


AuthController.post("/login", async (req: Request, res: Response) => {
  const userDto = req.body as IUserDto;
  try {
    const response = await authService.login(userDto);
    if (response.success) {
      res.status(200).json(response);
      return;
    }
    res.status(400).json(response);
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});


AuthController.post("/logout", checkToken, async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  const token = auth?.split(" ")[1];
  const response = await authService.logout(token!);
  res.status(200).json(response);
});


// password reset module - to be continued when email service is set up
AuthController.get("/get-otp", async (req: Request, res: Response) => {
  const email = req.body.email;
  try {
    const response = await authService.getOtp(email);
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});

AuthController.post("/validate-otp", async (req: Request, res: Response) => { });

AuthController.post("/reset-password", async (req: Request, res: Response) => { });

export default AuthController;
