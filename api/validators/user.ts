import { boolean, number, object, string } from "yup";
import { NotificationType } from "../typings/types";

const idPattern = /^\d{16,21}$/;

export const createNotificationValidator = object({
    content: string().required(),
    type: number()
        .oneOf([
            NotificationType.ApprovedBot,
            NotificationType.Comment,
            NotificationType.Mixed,
            NotificationType.RefusedBot,
        ])
        .required(),
    url: string().url(),
})
    .strict()
    .required()
    .noUnknown();

export const createTeamValidator = object({
    invite_hash: string().max(6),
    name: string().required().min(3).max(15).required(),
    avatar_url: string().required(),
    description: string().min(5).max(50),
    bot_id: string().matches(idPattern),
})
    .required()
    .noUnknown();

export const updateTeamValidator = object({
    name: string().min(3).max(15),
    avatar_url: string(),
    description: string().min(5).max(50),
    bot_id: string().matches(idPattern),
})
    .test("at-least-one-key", "You must pass at least one key", (obj) => {
        return Object.keys(obj).length > 0;
    })
    .noUnknown()
    .strict();

export const updateUserValidator = object({
    bio: string().max(200).min(1),
    notifications_viewed: boolean(),
})
    .noUnknown()
    .strict()
    .test(
        "at-least-one-options",
        "you must pass at least one option",
        (obj) => {
            return Object.keys(obj).length > 0;
        }
    );
