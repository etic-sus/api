import parseMs from "ms";
import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { botSchema } from "../../models/Bot";
import { verify, JwtPayload } from "jsonwebtoken";
import { feedbackSchema } from "../../models/Feedback";
import { botSchemaValidator } from "../../validators/bots";
import { feedbackValidator } from "../../validators/feedback";
import { GENERICS, BOT, FEEDBACK } from "../../helpers/errors.json";
import { webhooks } from "../../helpers/webhooks";

/**
 * Creates a bot, vote, or submit a feedback
 */
export const createBot = async (req: Request, res: Response) => {
    const { id: botId, method, user: author } = req.params;

    const JwtPayload = verify(
        req.headers.authorization as string,
        process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (method === "feedbacks") {
        if (!author)
            return res
                .status(HttpStatusCode.NotFound)
                .json(FEEDBACK.UNKNOWN_USER);

        const exists = await feedbackSchema.exists({
            "author.id": JwtPayload.id,
            target_bot: botId,
        });

        if (exists)
            return res
                .status(HttpStatusCode.Conflict)
                .json(FEEDBACK.THE_USER_ALREADY_SENT);

        const { body } = req;

        if (body.reply_message)
            return res
                .status(HttpStatusCode.BadRequest)
                .json(FEEDBACK.CANNOT_REPLY_WHEN_CREATE);

        const validation = await feedbackValidator
            .validate(body)
            .catch((error) => error.errors);

        if (Array.isArray(validation))
            return res
                .status(HttpStatusCode.BadRequest)
                .json({ errors: validation });

        const createdFeedback = await feedbackSchema.create({
            ...body,
            posted_at: new Date().toISOString(),
            author_id: JwtPayload.id,
            target_bot: botId,
        });

        if (!createdFeedback)
            return res
                .status(HttpStatusCode.InternalServerError)
                .json(GENERICS.INTERNAL_SERVER_ERROR);

        return res.status(HttpStatusCode.Created).json(createdFeedback);
    }

    const { body } = req;
    const exists = await botSchema.exists({ _id: botId });

    if (method === "votes") {
        if (!exists)
            return res.status(HttpStatusCode.NotFound).json(BOT.UNKNOWN_BOT);

        if (!("user" in body))
            return res
                .status(HttpStatusCode.BadRequest)
                .json(GENERICS.MISSING_USER);

        const request = await fetch(
            `https://discord.com/api/v10/users/${body.user}`,
            {
                method: "GET",
                headers: { Authorization: `Bot ${process.env.CLIENT_TOKEN}` },
            }
        );

        const { bot: isBot } = await request.json();

        if (isBot || body.user === botId)
            return res
                .status(HttpStatusCode.BadRequest)
                .json(BOT.BOT_CANNOT_VOTE_IN_A_BOT);

        const votes = await botSchema.findOne({
            _id: botId,
            "votes.user": body.user,
        });

        if (!votes) {
            const voteBody = {
                user: body.user,
                last_vote: new Date().toISOString(),
                votes: 1,
            };

            const newVote = await botSchema.findOneAndUpdate(
                { _id: botId },
                { $push: { votes: voteBody } },
                { new: true }
            );

            return res.status(HttpStatusCode.Ok).json(newVote?.votes);
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { last_vote } = votes.votes.find(
            (vote) => vote.user === body.user
        )!;

        const twelveHours = 4.32e7;
        const timeLeft = new Date().getTime() - new Date(last_vote).getTime();

        if (!(timeLeft > twelveHours))
            return res.status(HttpStatusCode.TooManyRequests).json({
                message: BOT.COOLDOWN_VOTE.message.replace(
                    "{ms}",
                    parseMs(twelveHours - timeLeft, { long: true })
                ),
                code: BOT.COOLDOWN_VOTE.code,
            });

        const vote = await botSchema.findOneAndUpdate(
            { _id: botId, "votes.user": body.user },
            {
                $inc: { "votes.$.votes": 1, total_votes: 1 },
                $set: {
                    "votes.$.last_vote": new Date().toISOString(),
                },
            },
            { new: true }
        );

        return res.status(HttpStatusCode.Ok).json(vote?.votes);
    }

    if (exists)
        return res.status(HttpStatusCode.Conflict).json(BOT.BOT_ALREADY_EXISTS);

    const validation = await botSchemaValidator
        .validate(body)
        .catch((error) => error.errors);

    if (Array.isArray(validation))
        return res
            .status(HttpStatusCode.BadRequest)
            .json({ errors: validation });

    const createdBot = await botSchema.create({
        ...body,
        _id: botId,
    });

    if (!createdBot)
        return res
            .status(HttpStatusCode.InternalServerError)
            .json(GENERICS.INTERNAL_SERVER_ERROR);

    const createdAt: number = Math.round(
        new Date(parseFloat(botId) / 4194304 + 1420070400000).getTime() / 1000
    );

    await webhooks.bot(createdBot, createdAt);
    await webhooks.logs(createdBot);
    await webhooks.raw(createdBot);

    return res.status(HttpStatusCode.Ok).json(createdBot);
};
