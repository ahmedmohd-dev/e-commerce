const Order = require("../models/Order");

exports.submitTelebirr = async (req, res) => {
  try {
    const { orderId, transactionNumber } = req.body;
    if (!orderId || !transactionNumber)
      return res.status(400).json({ message: "Missing fields" });
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.paymentMethod = "telebirr-manual";
    order.paymentResult = {
      ...(order.paymentResult || {}),
      transactionNumber,
      verifiedByAdmin: false,
    };
    order.status = "pending";
    await order.save();
    res.json({
      message: "Transaction submitted. Pending admin verification.",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit transaction" });
  }
};





