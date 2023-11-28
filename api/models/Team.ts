import { Schema, model } from "mongoose";
import type { Team } from "../typings/types";

const rawTeamSchema = new Schema<Team>({
    bot_id: { type: String, required: true },
    description: String,
    avatar_url: {
        type: String,
        required: true,
    },
    name: { type: String, required: true },
    invite_code: String,
    id: { type: String, required: true },
    members: {
        type: [
            {
                id: String,
                permission: Number,
                _id: false,
            },
        ],
        default: [],
    },
});

export const teamModel = model("teams", rawTeamSchema);