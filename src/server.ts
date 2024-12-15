import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import createError from 'http-errors';
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
const server = express();

import { connect_db, client } from './db';
import IndexController from './Controllers';
import deleteOldItems from './cron';


connect_db().then(() => console.log("DB Connected!"));

// deleteOldItems();

const logStream = fs.createWriteStream(path.join(__dirname, 'logs', 'invoicemaker.log'), { flags: 'a' });
server.use(morgan('common', { stream: logStream }));
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(cors());

server.use("/api", IndexController);

server.use((req, res, next) => {
  next(createError(404));
});

server.use((err: { message: any; status: any; }, req: Request, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


// cleanup mongo connection
const cleanup = () => {
  client.close();
  console.log("Closing mongodb client...");
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

server.listen(3000, () => console.log("Server started on 3000"));

export default server;
