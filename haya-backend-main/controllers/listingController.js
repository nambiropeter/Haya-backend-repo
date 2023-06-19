const Business = require("../model/Business");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Redis = require("redis");

const redisClient = Redis.createClient();

const getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({});
    res.json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const approveBusiness = async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).send({ error: "Business not found" });
    }

    business.isApproved = true;
    await business.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "hayabusinesses@gmail.com",
        pass: "jxfxqcbreocephbv",
      },
    });

    const mailOptions = {
      from: { name: "Haya Businesses", address: "hayabusinesses@gmail.com" },
      to: business.email,
      subject: "Your business is now approved and listed on our platform",
      html: `
        <p>Congratulations! Your business "${business.businessName}" is now approved and listed on our platform.</p>
        <p>Visit our website to see your business <a href="https://haya.business/listing/${business._id}">here</a>.</p>
        <p>Thank you for choosing Haya!</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Send notification emails to additional recipients
    const additionalRecipients = [
      // "campnoch@gmail.com",
      // "matthewmagera@gmail.com",
      // "shadrackhibi@gmail.com",
      // "tishawangui@gmail.com",
      "hayabusinesses@gmail.com",
    ];

    const notificationMailOptions = {
      from: { name: "Haya Businesses", address: "hayabusinesses@gmail.com" },
      to: additionalRecipients.join(", "),
      subject: "New business approved on Haya",
      html: `
        <p>A new business "${business.businessName}" has been approved and listed on Haya.</p>
        <p>Visit the business <a href="https://haya.business/listing/${business._id}">here</a>.</p>
      `,
    };

    await transporter.sendMail(notificationMailOptions);

    res.status(200).send({ message: "Business approved and email sent" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Something went wrong" });
  }
};

const getAllApprovedBusinesses = async (req, res) => {
  const businesses = await Business.find({ isApproved: true });
  if (!businesses)
    return res.status(204).json({ message: "No businesses found." });
  res.json(businesses);
};

const getBusiness = async (req, res) => {
  if (!req?.params?.id)
    return res.status(400).json({ message: "Business ID is required." });

  const business = await Business.findOne({ _id: req.params.id }).exec();
  if (!business) {
    return res
      .status(204)
      .json({ message: `No business matches ID ${req.params.id}.` });
  }
  res.json(business);
};

const updateBusinessDetails = async (req, res) => {
  const updates = req.body;
  if (
    !updates.businessName ||
    !updates.email ||
    !updates.whatsAppNumber ||
    !updates.category ||
    !updates.location
  )
    return res
      .status(400)
      .json({ message: "Some required fields have not been filled." });

  try {
    const businessId = req.params.id;

    // Check if email is already taken
    const emailExists = await Business.findOne({ email: updates.email });
    if (emailExists && emailExists._id.toString() !== businessId) {
      return res.status(400).json({ message: "Email is already taken" });
    }

    // Update the business
    const result = await Business.updateOne(
      { _id: businessId },
      { $set: updates }
    );

    // Check if business was found and updated
    if (result.acknowledged) {
      if (result.modifiedCount > 0) {
        return res
          .status(200)
          .json({ message: "Business account updated successfully" });
      } else {
        return res.status(404).json({ message: "Business account not found" });
      }
    } else {
      return res.status(500).json({ message: "Something went wrong" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.params;

  try {
    // Retrieve the business from the database
    const business = await Business.findById(id);

    // Verify the old password using bcrypt
    const isMatch = await bcrypt.compare(oldPassword, business.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid old password" });
    }

    // Hash the new password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password field in the business document
    business.password = hashedPassword;

    // Save the updated document to the database
    await business.save();

    // Return a success response
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const businessId = req.params.id;
    const password = req.query.password;

    // Check that password is provided
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Find the business
    const foundBusiness = await Business.findOne({ _id: businessId }).exec();

    // Check if business was found
    if (!foundBusiness) {
      return res.status(404).json({ message: "Business account not found" });
    }

    // Check if password is correct
    if (!foundBusiness.password) {
      return res.status(500).json({ message: "Internal server error" });
    }
    const match = await bcrypt.compare(password, foundBusiness.password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    } else {
      // Delete the business
      const result = await Business.deleteOne({ _id: businessId });
      // Check if business was deleted
      if (result.deletedCount === 1) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "hayabusinesses@gmail.com",
            pass: "jxfxqcbreocephbv",
          },
        });

        const emailContent = `A business "${foundBusiness.businessName}" deleted their account. Here is their contact Information: ${foundBusiness.email}, ${foundBusiness.whatsAppNumber}`;

        const mailOptions = {
          from: {
            name: "Haya Businesses",
            address: "hayabusinesses@gmail.com",
          },
          to: [
            // "campnoch@gmail.com",
            // "matthewmagera@gmail.com",
            // "shadrackhibi@gmail.com",
            // "tishawangui@gmail.com",
            "hayabusinesses@gmail.com",
          ],
          subject: "Account Deletion Notification",
          text: emailContent,
        };

        await transporter.sendMail(mailOptions);
        return res
          .status(200)
          .json({ message: "Business account deleted successfully" });
      } else {
        return res
          .status(500)
          .json({ message: "Failed to delete business account" });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addProductToInventory = async (req, res) => {
  try {
    const businessId = req.params.id;
    const newProduct = req.body;

    // Find the business and add the product to its inventory
    const result = await Business.updateOne(
      { _id: businessId },
      { $push: { inventory: newProduct } }
    );

    // Check if business was found and product added
    if (result.acknowledged) {
      if (result.modifiedCount > 0) {
        return res.status(200).json({ message: "Product added successfully" });
      } else {
        return res.status(404).json({ message: "Business account not found" });
      }
    } else {
      return res.status(500).json({ message: "Something went wrong" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProductInInventory = async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const productId = req.params.productId;
    const updates = req.body;

    // Find the business and update the product in its inventory
    const result = await Business.updateOne(
      { _id: businessId, "inventory._id": productId },
      { $set: { "inventory.$": updates } }
    );

    // Check if business and product were found and updated
    if (result.acknowledged) {
      if (result.modifiedCount > 0) {
        return res
          .status(200)
          .json({ message: "Product updated successfully" });
      } else {
        return res.status(404).json({ message: "Business account not found" });
      }
    } else {
      return res.status(500).json({ message: "Something went wrong" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProductFromInventory = async (req, res) => {
  const { businessId, productId } = req.params;

  try {
    // Find the business by its ID and update the inventory
    const business = await Business.findByIdAndUpdate(
      businessId,
      { $pull: { inventory: { _id: productId } } },
      { new: true }
    );

    // Check if the business was found
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllApprovedBusinesses,
  getAllBusinesses,
  getBusiness,
  updateBusinessDetails,
  changePassword,
  deleteAccount,
  addProductToInventory,
  updateProductInInventory,
  deleteProductFromInventory,
  approveBusiness,
};
