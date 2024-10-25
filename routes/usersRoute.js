const router = require("express").Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");

// register user account

router.post("/register", async (req, res) => {
  try {
    // check if user already exists

    let user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.send({
        success: false,
        message: "User already exists",
      });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.send({
        success: false,
        message: "Passwords do not match",
      });
    }
    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashedPassword;
    const newUser = new User(req.body);
    await newUser.save();
    res.send({
      message: "user created successfully",
      data: null,
      success: true,
    });
  } catch (error) {
    res.send({
      message: error.message,
      success: false,
    });
  }
});

// login user account

router.post("/login", async (req, res) => {
  try {
    // check if user exists
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.send({
        success: false,
        message: "user does not exist",
      });
    }

    // check if password is correct

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.send({
        success: false,
        message: "Invalid password",
      });
    }

    // check if user is verified

    if (!user.isVerified) {
      return res.send({
        success: false,
        message: "User is not verified yet or account suspended",
      });
    }

    // generate token
    const token = jwt.sign({ userId: user.id }, process.env.jwt_secret, {
      expiresIn: "1d",
    });
    res.send({
      message: "user logged in successfully",
      data: token,
      success: true,
    });
  } catch (error) {
    res.send({
      message: error.message,
      success: false,
    });
  }
});

//get user info

router.post("/get-user-info", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    res.send({
      message: "User info fetched successfully",
      data: user,
      success: true,
    });
  } catch (error) {
    res.send({
      message: error.message,
      success: false,
    });
  }
});

//get all users

router.post("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false });
    res.send({
      message: "Users fetched successfully",
      data: users,
      success: true,
    });
  } catch (error) {
    res.send({
      message: error.message,
      success: false,
    });
  }
});

// verify user account

router.post(
  "/update-user-verification-status",
  authMiddleware,
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.body.selectedUserId, {
        isVerified: req.body.isVerified,
      });
      res.send({
        message: "Account Verification Status updated successfully",
        data: null,
        success: true,
      });
    } catch (error) {
      res.send({
        message: error.message,
        data: error,
        success: false,
      });
    }
  }
);

module.exports = router;
