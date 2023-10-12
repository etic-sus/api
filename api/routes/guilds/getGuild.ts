import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { GUILD } from "../helpers/errors.json";
import { guildSchema } from "../../schemas/Guild";

/**
 * Gets a guild in the database
 */
export const getGuild = async (req: Request, res: Response) => {
    const guild = await guildSchema.findById({
        _id: req.params.guildId,
    });

    if (!guild)
        return res.status(HttpStatusCode.NotFound).json(GUILD.GUILD_NOT_FOUND);

    return res.status(HttpStatusCode.Ok).json(guild);
};