require("dotenv").config();
import express, { Application } from "express";
import path from "path";
import route from "./Routes/routes";
import connectToDatabase from "./Database/mongoDb";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from "passport-jwt";
import { JwtPayload } from "./types/commonModel";
import { Admin } from "./models/AdminModal/AdminModal";
import { AdminResponse } from "./types/admin";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

// instantize an app from express() function
const app: Application = express();

app.disable('x-powered-by');
app.use(cookieParser());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
  "https://nexusappdevelopers.com",
  "https://www.nexusappdevelopers.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://dev.vrnexusapp.com",
  "https://nexus-psi-rust.vercel.app"
];

//Add Cors Policies
app.use(
  cors({
    origin: (origin: any, callback: any) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);

const cookieExtractor = (req: express.Request): string | null => {
  if (req && req.cookies && req.cookies.nexus_session) {
    return req.cookies.nexus_session;
  }
  return null;
};

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    cookieExtractor,
    ExtractJwt.fromAuthHeaderAsBearerToken()
  ]),
  secretOrKey: process.env.JWT_SECRET as string, // Ensure JWT_SECRET is defined in your environment variables
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload: JwtPayload, done) => {
    try {
      let AdminUser:AdminResponse | null = await Admin.findOne({ _id: jwt_payload.identifier });
      if (AdminUser) {
        return done(null, AdminUser);
      } else {
        return done(null, false);
        // or you could create a new account
      }
    } catch (error) {
      return done(error, false);
    }
  })
);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
// Static files for uploads (e.g., /uploads/testimonials/<file>)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/static", express.static(path.join(__dirname, "../public/static")));
app.use("/public", express.static(path.join(__dirname, "../public")));

//MongoDb setup
connectToDatabase();
app.use(route);
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("server has started on port");
  console.log("http://localhost:" + PORT);
});
