import { verify } from "jsonwebtoken";
import { HttpStatusCode } from "axios";
import { GENERICS } from "../utils/errors.json";
import type { Request, Response, NextFunction } from "express";

export const auth = (req: Request, res: Response, next: NextFunction) => {
    const jwtToken = req.headers.authorization;

    if (!jwtToken)
        return res
            .status(HttpStatusCode.BadRequest)
            .json(GENERICS.INVALID_AUTH);

    try {
        const jwtSecrect = process.env.JWT_SECRET as string;

        verify(jwtToken, jwtSecrect);

        next();
    } catch {
        return res
            .status(HttpStatusCode.BadRequest)
            .json(GENERICS.INVALID_AUTH);
    }
};
