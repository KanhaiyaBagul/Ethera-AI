const jwt = require('jsonwebtoken');

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = { signToken };
