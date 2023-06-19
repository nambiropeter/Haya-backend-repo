const Business = require("../model/Business");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  const foundBusiness = await Business.findOne({ refreshToken }).exec();
  if (!foundBusiness) return res.sendStatus(403); // Forbidden

  // Evaluate jwt

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || foundBusiness.email !== decoded.email)
      return res.sendStatus(403);
    const accessToken = jwt.sign(
      { email: decoded.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "900s" }
    );
    res.json({ accessToken });
  });
};

module.exports = { handleRefreshToken };
