export const jwtConstants = {
  secret: process.env.JWT_SECRET
};

console.log('jwtConstants.secret in constants.ts: ', jwtConstants.secret)