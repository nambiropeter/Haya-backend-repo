const Business = require("../model/Business");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password are required." });

  const foundBusiness = await Business.findOne({ email }).exec();
  if (!foundBusiness) return res.sendStatus(401); //Unauthorized

  // Evaluate password
  const match = await bcrypt.compare(password, foundBusiness.password);

  if (match) {
    // Create JWTs
    const accessToken = jwt.sign(
      { email: foundBusiness.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { email: foundBusiness.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    // Saving refreshToken with current business
    foundBusiness.refreshToken = refreshToken;
    const result = await foundBusiness.save();
    console.log(result);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      /* secure: true,*/
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken, foundBusiness });
  } else {
    res.sendStatus(401);
  }
};

const handleForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the business by email
    const foundBusiness = await Business.findOne({ email }).exec();
    if (!foundBusiness) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Generate a reset token using JWT
    const resetToken = jwt.sign(
      { email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Update the business with the reset token
    foundBusiness.resetToken = resetToken;
    await foundBusiness.save();

    const resetLink = `https://haya.business/reset-password/${resetToken}`;

    // Send the reset email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "hayabusinesses@gmail.com",
        pass: "jxfxqcbreocephbv",
      },
    });

    const mailOptions = {
      from: { name: "Haya Businesses", address: "hayabusinesses@gmail.com" },
      to: email,
      subject: "Reset Your Password",
      html: `<p>Hi ${foundBusiness.businessName},<br/><br/> Please click <a href="${resetLink}">here</a> to reset your password.<br/><br/>This link is only valid for 1 hour.<br/><br/>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Reset link sent to email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const handleResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Verify the reset token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the business by email
    const foundBusiness = await Business.findOne({
      email: decodedToken.email,
    }).exec();
    if (!foundBusiness) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Update the password with the new hashed password
    const hashedPassword = await bcrypt.hash(password, 10);
    foundBusiness.password = hashedPassword;
    foundBusiness.resetToken = undefined; // Clear the reset token
    await foundBusiness.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

module.exports = { handleLogin, handleForgotPassword, handleResetPassword };
