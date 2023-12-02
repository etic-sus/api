import type { Request, Response } from "express";
import { getUserId } from "../../utils/getUserId";
import { kickMember } from "./kickMember";
import { teamModel } from "../../models/Team";
import { HttpStatusCode } from "axios";
import { TEAM, USER } from "../../utils/errors.json";
import { AuditLogActionType, TeamPermissions } from "../../typings/types";
import { changeOwner } from "./changeOwner";
import { createAuditLogEntry } from "./createAuditLog";

export const joinTeam = async (req: Request, res: Response) => {
    const userId = await getUserId(req.headers);

    if (!userId)
        return res.status(HttpStatusCode.NotFound).json(USER.UNKNOWN_USER);

    const { teamId, inviteCode } = req.params;

    if (teamId === "change-owner")
        return changeOwner(res, {
            userId: req.params.targetId,
            authorId: userId,
            teamId,
        });
    if (inviteCode === "remove-member") return kickMember(req, res);

    const team = await teamModel.findOne({ id: teamId });

    if (!team) return res.status(HttpStatusCode.Ok).json(TEAM.UNKNOWN_TEAM);

    if (team.invite_code !== inviteCode)
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
    await createAuditLogEntry({
        teamId,
        executor_id: userId,
        created_at: new Date().toISOString(),
        action_type: AuditLogActionType.MemberAdd,
        target_id: userId,
        changes: [],
    });

    return res.status(HttpStatusCode.NoContent).send();
};
