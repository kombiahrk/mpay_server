const router = require("express").Router();
const Request = require("../models/requestsModel");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/userModel");
const Transaction = require("../models/transcationModel");

//get all requests for a user
router.post("/get-all-requests-by-user", authMiddleware, async (req, res) => {
  try {
    const requests = await Request.find({
      $or: [{ sender: req.body.userId }, { receiver: req.body.userId }],
    })
      .populate("sender")
      .populate("receiver").sort('-createdAt');

    res.send({
      data: requests,
      message: "Requests fetched successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// send a request to another user

router.post("/send-request", authMiddleware, async (req, res) => {
  try {
    const { receiver, amount, description } = req.body;
    const request = new Request({
      sender: req.body.userId,
      receiver,
      amount,
      description,
    });

    await request.save();

    res.send({
      message: "Request sent successfully",
      data: request,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// accept a request

router.post("/update-request-status", authMiddleware, async (req, res) => {
  try {
    if (req.body.status === "accepted") {
      //create a transaction
      const newTransaction = new Transaction({
        sender: req.body.receiver._id,
        receiver: req.body.sender._id,
        amount: req.body.amount,
        status: "success",
        reference: req.body.description,
      });

      await newTransaction.save();

      // update the balance of both users
      // deduct the amount from the sender
      await User.findByIdAndUpdate(req.body.sender._id, {
        $inc: { balance: req.body.amount },
      })      
      // add the amount to the receiver
      await User.findByIdAndUpdate(req.body.receiver._id, {
        $inc: { balance: -req.body.amount },
      }); 
    }

    await Request.findByIdAndUpdate(req.body._id, {
      status: req.body.status,
    });

    res.send({
      data: null,
      message: "Request updated successfully",
      success: true,
    });
  } catch (error) {
    res.send({
      data: error,
      message: error.message,
      success: false,
    });
  }
});

module.exports = router;
  