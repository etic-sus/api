import cors from "cors";
import { load } from "env-smart";
import { connect } from "mongoose";
import cookieParser from "cookie-parser";
import { auth } from "./middlewares/auth";
import { default as express } from "express";
import { getBot } from "./routes/bots/getBot";
import { PORT, ROUTES } from "../constants.json";
import { getUser } from "./routes/users/getUser";
import { getToken } from "./routes/auth/getToken";
import { callback } from "./routes/auth/callback";
import { createBot } from "./routes/bots/createBot";
import { getStatus } from "./routes/status/getStatus";
import { createNotification } from "./routes/users/createNotification";
import { deleteNotification } from "./routes/users/deleteNotification";
import { updateBotOrFeedback } from "./routes/bots/updateBotOrFeedback";
import { deleteBotOrFeedback } from "./routes/bots/deleteBotOrFeedback";
import { createToken } from "./routes/auth/createToken";
import { getVoteStatus } from "./routes/v1/vote-status";
import { apiKeyAuth } from "./middlewares/apiKeyAuth";
import { updateUser } from "./routes/users/updateUser";
import { getTeam } from "./routes/teams/getTeam";
import { createTeam } from "./routes/teams/createTeam";
import { deleteTeam } from "./routes/teams/deleteTeam";
import { updateTeam } from "./routes/teams/updateTeam";

load();

const app = express();

app.set("trust proxy", 1);
app.use(
    express.json({ strict: true }),
    cors({
        credentials: true,
        origin: ["https://simo-botlist.vercel.app", "http://localhost:5173"],
    }),
    cookieParser(),
    (req, res, next) => {
        requestCount++;

        next();
    }
);

app.route(ROUTES.USER)
    .get(getUser)
    .post(auth, createNotification)
    .delete(auth, deleteNotification)
    .patch(auth, updateUser);
app.route(ROUTES.AUTH).get(callback);
app.route(ROUTES.TOKEN).get(auth, getToken).post(auth, createToken);
app.route(ROUTES.BOTS)
    .get(getBot)
    .delete(auth, deleteBotOrFeedback)
    .patch(auth, updateBotOrFeedback)
    .post(auth, createBot);
app.route(ROUTES.STATUS).get(getStatus);
app.route(ROUTES.V1.VOTE).get(apiKeyAuth, getVoteStatus);
app.route(ROUTES.TEAM)
    .get(getTeam)
    .post(createTeam)
    .delete(deleteTeam)
    .patch(updateTeam);

export let requestCount = 0;

export let uptime: number;

app.listen(PORT, async () => {
    uptime = Date.now();

    await connect(process.env.MONGOOSE_URL as string).catch(console.error);

    console.info(`API iniciada na porta ${PORT}`);
});

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
