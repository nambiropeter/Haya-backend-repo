const Business = require("../model/Business");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const handleNewBusiness = async (req, res) => {
  const {
    businessName,
    email,
    whatsAppNumber,
    category,
    shortDescription,
    location,
    googleMapsLink,
    facebookLink,
    instagramLink,
    twitterLink,
    linkedInLink,
    password,
  } = req.body;

  if (
    !businessName ||
    !email ||
    !whatsAppNumber ||
    !category ||
    !location ||
    !password
  )
    return res
      .status(400)
      .json({ message: "Some required fields have not been filled." });

  // Check for duplicate emails in the db
  const duplicate = await Business.findOne({ email }).exec();
  if (duplicate) return res.sendStatus(409); // Conflict

  try {
    // Encrypt the password
    const hashedPwd = await bcrypt.hash(password, 10);

    // Generate a verification token using JWT
    const verificationToken = jwt.sign(
      { email },
      process.env.ACCESS_TOKEN_SECRET
    );

    // Create and store the new business
    const result = await Business.create({
      businessName,
      email,
      whatsAppNumber,
      category,
      shortDescription,
      location,
      googleMapsLink,
      facebookLink,
      instagramLink,
      twitterLink,
      linkedInLink,
      businessLogo: "",
      password: hashedPwd,
      inventory: [],
      verificationToken,
    });

    const verificationLink = `https://haya.business/verify-email/${verificationToken}`;

    // Send the verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "hayabusinesses@gmail.com",
        pass: "jxfxqcbreocephbv",
      },
    });

    const mailOptions = {
      from: {
        name: "Haya Businesses",
        address: "hayabusinesses@gmail.com",
      },
      to: email,
      subject: "Verify Your Email",
      html: `<p>Hi ${result.businessName},<br/><br/> Please click <a href="${verificationLink}">here</a> to verify your email.</p>`,
    };

    await transporter.sendMail(mailOptions);

    console.log(result);

    // Send notification emails
    const notificationEmails = [
      // "campnoch@gmail.com",
      // "matthewmagera@gmail.com",
      // "shadrackhibi@gmail.com",
      // "tishawangui@gmail.com",
      "hayabusinesses@gmail.com",
    ];

    const notificationMailOptions = {
      from: {
        name: "Haya Businesses",
        address: "hayabusinesses@gmail.com",
      },
      to: notificationEmails.join(","),
      subject: "New Business Registration",
      html: `<p>A new business has registered on Haya:<br/><br/>Business Name: ${result.businessName}<br/>Email: ${result.email}<br/>Phone Number: ${result.whatsAppNumber}<br/>Category: ${result.category}<br/>Short Description: ${result.shortDescription}<br/>Location: ${result.location}</p>`,
    };

    await transporter.sendMail(notificationMailOptions);

    res.status(201).json({ success: `New business ${businessName} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const handleVerifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    // Verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the business by email
    const foundBusiness = await Business.findOne({
      email: decodedToken.email,
    }).exec();
    if (!foundBusiness) return res.sendStatus(404); // Not found

    // Update the verified field and remove the verification token
    foundBusiness.isVerified = true;
    foundBusiness.verificationToken = undefined;
    await foundBusiness.save();

    res.status(200).json({ message: "Email verified." });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

module.exports = { handleNewBusiness, handleVerifyEmail };
