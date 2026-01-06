import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { eq } from 'drizzle-orm';
import { db, users } from '../../db';
import { jwtConfig } from './jwt';
import { JwtPayload } from '../types';

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtConfig.secret,
};

passport.use(
  new JwtStrategy(options, async (payload: JwtPayload, done) => {
    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
        })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      const user = result[0];

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;
