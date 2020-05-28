const JWTStrategy = require('passport-jwt').Strategy;

const cookieExtractor = (req) => { // eslint-disable-line
    return req && req.cookies ? req.cookies['jwt'] : null; // eslint-disable-line
};

module.exports = (passport, db) => {
    passport.use(new JWTStrategy({
        secretOrKey: process.env.JWT_SECRET,
        issuer: `${process.env.TEAM} Football Risk`,
        audience: process.env.JWT_DOMAIN,
        jwtFromRequest: cookieExtractor,
        passReqToCallback: true
    }, async (req, payload, done) => {
        try {
            if (!payload.roles || !payload.roles.includes('vetted') || !payload.roles.includes('allied')) {
                const player = await db.oneOrNone(
                    'SELECT * FROM player where id = $1', [
                        payload.id
                    ]
                );

                const roles = await db.any(
                    `
                        SELECT r.name
                        FROM role r
                            INNER JOIN player_role pr ON r.id = pr.role_id
                        WHERE pr.player_id = $1
                    `,
                    [payload.id]
                );

                done(null, {
                    iat: payload.iat,
                    id: player.id,
                    name: player.name,
                    discordId: player.discord_id,
                    discordName: player.discord_username,
                    roles: roles.map((r) => r.name)
                });
            } else {
                done(null, {
                    iat: payload.iat,
                    id: payload.id,
                    name: payload.name,
                    discordId: payload.discordId,
                    discordName: payload.discordName,
                    roles: payload.roles
                });
            }
        } catch (err) {
            done(err, null);
        }
    }));
};
