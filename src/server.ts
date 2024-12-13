import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import createError from 'http-errors';
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
const server = express();

import { main } from './db';
import IndexController from './Controllers';


main().then(() => console.log("DB connected"));

const logStream = fs.createWriteStream(path.join(__dirname, 'logs', 'invoicemaker.log'), { flags: 'a' });
server.use(morgan('common', { stream: logStream }));
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(cors());

server.use("/api", IndexController);

server.use((req, res, next) => {
  next(createError(404));
})

server.use((err: { message: any; status: any; }, req: Request, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
})

server.listen(3000, () => console.log("Server started on 3000"));

export default server;