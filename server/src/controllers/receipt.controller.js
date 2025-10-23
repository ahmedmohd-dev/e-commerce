const jsPDF = require("jspdf");
const QRCode = require("qrcode");

// Generate receipt PDF for download
const generateReceiptPDF = async (order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor = "#007bff";
  const secondaryColor = "#6c757d";
  const successColor = "#28a745";

  // Header
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("E-Commerce Store", 20, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Order Receipt", 20, 28);

  // Order Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Order #${order._id.slice(-8).toUpperCase()}`, 20, 45);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 55);
  doc.text(`Time: ${new Date(order.createdAt).toLocaleTimeString()}`, 20, 62);

  // Status
  doc.setFillColor(successColor);
  doc.rect(150, 40, 40, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(order.status.toUpperCase(), 160, 50);

  // Customer Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Information", 20, 80);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Name: ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
    20,
    90
  );
  doc.text(`Email: ${order.shippingAddress.email}`, 20, 97);
  doc.text(`Phone: ${order.shippingAddress.phone}`, 20, 104);

  // Shipping Address
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Shipping Address", 20, 120);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(order.shippingAddress.address, 20, 130);
  doc.text(
    `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
    20,
    137
  );
  doc.text(
    `${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`,
    20,
    144
  );

  // Items
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Order Items", 20, 160);

  let yPosition = 170;
  order.items.forEach((item, index) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${index + 1}. ${item.name}`, 20, yPosition);
    doc.text(`Qty: ${item.quantity}`, 120, yPosition);
    doc.text(`$${item.price.toFixed(2)}`, 150, yPosition);
    doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 180, yPosition);
    yPosition += 7;
  });

  // Payment Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Information", 20, yPosition + 10);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Method: ${order.paymentMethod.toUpperCase()}`, 20, yPosition + 20);

  if (order.paymentDetails?.transactionId) {
    doc.text(
      `Transaction ID: ${order.paymentDetails.transactionId}`,
      20,
      yPosition + 27
    );
  }

  // Totals
  const totalsY = yPosition + 40;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Order Summary", 20, totalsY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, 120, totalsY + 10);
  doc.text(`Tax (10%): $${order.tax.toFixed(2)}`, 120, totalsY + 17);
  doc.text(`Shipping: $${order.shipping.toFixed(2)}`, 120, totalsY + 24);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: $${order.total.toFixed(2)}`, 120, totalsY + 35);

  // Footer
  const footerY = pageHeight - 30;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(secondaryColor);
  doc.text("Thank you for your business!", 20, footerY);
  doc.text("For support, contact: support@ecommerce.com", 20, footerY + 7);
  doc.text("This is a computer-generated receipt.", 20, footerY + 14);

  return doc;
};

// Download receipt PDF (Public - no auth required)
const downloadReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const Order = require("../models/Order");
    const order = await Order.findById(orderId).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Generate PDF
    const doc = await generateReceiptPDF(order);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${order._id.slice(-8)}.pdf"`
    );

    // Send PDF
    const pdfBuffer = doc.output("arraybuffer");
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Receipt download error:", error);
    res.status(500).json({ message: "Failed to generate receipt" });
  }
};

// Download receipt PDF (Protected - requires authentication)
const downloadReceiptProtected = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id; // From auth middleware

    // Find the order and verify ownership
    const Order = require("../models/Order");
    const order = await Order.findOne({ 
      _id: orderId, 
      user: userId 
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found or you don't have permission to access it" 
      });
    }

    // Generate PDF
    const doc = await generateReceiptPDF(order);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${order._id.slice(-8)}.pdf"`
    );

    // Send PDF
    const pdfBuffer = doc.output("arraybuffer");
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Protected receipt download error:", error);
    res.status(500).json({ message: "Failed to generate receipt" });
  }
};

module.exports = {
  downloadReceipt,
  downloadReceiptProtected,
};


