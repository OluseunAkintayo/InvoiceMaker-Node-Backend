import { NextFunction, Request, Response } from "express";

const validate = (schema: { validate: (arg0: any) => any; }) => async (req: Request, res: Response, next: NextFunction) => {
	try {
		await schema.validate(req.body);
		return next();
	} catch (error) {
    const err = error as { name: string; path: string; errors: Array<string> };
		res.status(400).json({ status: 0, type: err.name, field: err.errors[0] + " field - " + err.path });
	}
}

export default validate;