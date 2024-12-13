import { NextFunction, Request, Response } from "express";

const validate = (schema: { validate: (arg0: any) => any; }) => async (req: Request, res: Response, next: NextFunction) => {
	try {
		await schema.validate(req.body);
		return next();
	} catch (error) {
    const err = error as { name: string; message: string };
		// res.status(400).json({ status: 0, type: err.name, message: err.message });
		res.send(error);
	}
}

export default validate;