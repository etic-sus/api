import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { JwtPayload, verify } from "jsonwebtoken";
import { botSchema } from "../../models/Bot";
import { BOT } from "../../helpers/errors.json";

const generateHash = (): string => Math.random().toString(20).substring(2);

export const createToken = async (req: Request, res: Response) => {
    const { botId, method } = req.params;

    if (method === "api-key") {
        const userData = verify(
            req.headers.authorization as string,
            process.env.JWT_SECRET as string
        ) as JwtPayload;

        const apikey = `${generateHash()}-${generateHash()}-${generateHash()}`;

        const bot = await botSchema.findById(botId);

        if (bot && bot.owners.includes(userData.id)) {
            await botSchema.findByIdAndUpdate(botId, {
                api_key: apikey
            });

            return res.status(HttpStatusCode.Created).json({ api_key: apikey });
        }

        return res.status(HttpStatusCode.Unauthorized).json(BOT.NOT_BOT_OWNER);
    }
};