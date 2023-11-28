import type { Request, Response } from "express";
import { getUserId } from "../../utils/getUserId";
import { kickMember } from "./kickMember";
import { teamModel } from "../../models/Team";
import { HttpStatusCode } from "axios";
import { TEAM, USER } from "../../utils/errors.json";
import { TeamPermissions } from "../../typings/types";
import { changeOwner } from "./changeOwner";

export const joinTeam = async (req: Request, res: Response) => {
    const userId = await getUserId(req.headers);

    if (!userId)
        return res.status(HttpStatusCode.NotFound).json(USER.UNKNOWN_USER);

    const { teamId, invite } = req.params;

    if (teamId === "change-owner")
        return changeOwner(res, {
            userId: req.params.targetId,
            authorId: userId,
            teamId,
        });
    if (invite === "remove-member") return kickMember(req, res);

    const team = await teamModel.findOne({ id: teamId });

    if (!team) return res.status(HttpStatusCode.Ok).json(TEAM.UNKNOWN_TEAM);

    if (team.invite_code !== invite)
        return res
            .status(HttpStatusCode.BadRequest)
            .json(TEAM.INVALID_INVITE_HASH);
    if (team.members.some((member) => member.id === userId))
        return res
            .status(HttpStatusCode.BadRequest)
            .json(TEAM.ALREADY_A_MEMBER);

    await team.updateOne({
        $push: {
            members: { id: userId, permission: TeamPermissions.ReadOnly },
        },
    });

    return res.status(HttpStatusCode.NoContent).send();
};
