import cors from "cors";
import { load } from "env-smart";
import { connect } from "mongoose";
import cookieParser from "cookie-parser";
import { auth } from "./middlewares/auth";
import { default as express } from "express";
import { getBot } from "./routers/bots/getBot";
import { PORT, ROUTES } from "../constants.json";
import { getUser } from "./routers/users/getUser";
import { getToken } from "./routers/auth/getToken";
import { callback } from "./routers/auth/callback";
import { createBot } from "./routers/bots/createBot";
import { getGuild } from "./routers/guilds/getGuild";
import { createGuild } from "./routers/guilds/createGuild";
import { updateGuild } from "./routers/guilds/updateGuild";
import { deleteGuild } from "./routers/guilds/deleteGuild";
import { discordWebhook } from "./routers/webhooks/discordWebhook";
import { updateBotOrFeedback } from "./routers/bots/updateBotOrFeedback";
import { deleteBotOrFeedback } from "./routers/bots/deleteBotOrFeedback";

load();

const app = express();

app.set("trust proxy", 1);
app.use(
    express.json({ strict: true }),
    cors({
        credentials: true,
        origin: ["https://simo-botlist.vercel.app", "http://localhost:5173"],
    }),
    cookieParser()
);

app.route(ROUTES.USER).get(getUser);
app.route(ROUTES.AUTH).get(callback);
app.route(ROUTES.TOKEN).get(getToken);
app.route(ROUTES.WEBHOOK).post(auth, discordWebhook);
app.route(ROUTES.BOTS)
    .get(getBot)
    .delete(auth, deleteBotOrFeedback)
    .patch(auth, updateBotOrFeedback)
    .post(auth, createBot);
app.route(ROUTES.GUILD)
    .get(getGuild)
    .delete(auth, deleteGuild)
    .patch(auth, updateGuild)
    .post(auth, createGuild);

app.listen(PORT, async () => {
    await connect(process.env.MONGOOSE_URL as string).catch(console.error);

    console.info(`API iniciada na porta ${PORT}`);
});

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
