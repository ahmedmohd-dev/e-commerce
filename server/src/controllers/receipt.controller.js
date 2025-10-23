const jsPDF = require("jspdf");
const QRCode = require("qrcode");

// Generate receipt PDF for download
const generateReceiptPDF = async (order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor = "#2563eb";
  const secondaryColor = "#64748b";
  const successColor = "#10b981";
  const warningColor = "#f59e0b";
  const dangerColor = "#ef4444";
  const lightGray = "#f8fafc";
  const darkGray = "#1e293b";

  // Background
  doc.setFillColor(lightGray);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Header with gradient effect
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 50, "F");

  // Company Logo/Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("🛍️ E-Commerce Store", 20, 25);

  // Receipt title
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Order Receipt", 20, 40);

  // Order number and date section
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 60, pageWidth - 30, 25, "F");
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Order #${order._id.slice(-8).toUpperCase()}`, 25, 75);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(secondaryColor);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 25, 82);
  
  doc.text(`Time: ${new Date(order.createdAt).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`, 25, 88);

  // Status badge
  const statusColor = order.status === 'completed' ? successColor : 
                     order.status === 'pending' ? warningColor : 
                     order.status === 'cancelled' ? dangerColor : primaryColor;
  
  doc.setFillColor(statusColor);
  doc.rect(pageWidth - 80, 65, 60, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(order.status.toUpperCase(), pageWidth - 75, 75);

  // Customer Information Section
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 95, pageWidth - 30, 40, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("👤 Customer Information", 25, 110);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`, 25, 120);
  doc.text(`Email: ${order.shippingAddress.email}`, 25, 127);
  doc.text(`Phone: ${order.shippingAddress.phone}`, 25, 134);

  // Shipping Address Section
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 145, pageWidth - 30, 50, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("📍 Shipping Address", 25, 160);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(order.shippingAddress.address, 25, 170);
  doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`, 25, 177);
  doc.text(`${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`, 25, 184);

  // Order Items Section
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 205, pageWidth - 30, 30 + (order.items.length * 15), "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("🛒 Order Items", 25, 220);

  // Items table header
  doc.setFillColor(primaryColor);
  doc.rect(25, 225, pageWidth - 50, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Item", 30, 233);
  doc.text("Qty", 120, 233);
  doc.text("Price", 150, 233);
  doc.text("Total", 180, 233);

  // Items
  let yPosition = 240;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  order.items.forEach((item, index) => {
    doc.text(`${index + 1}. ${item.name}`, 30, yPosition);
    doc.text(`${item.quantity}`, 120, yPosition);
    doc.text(`$${item.price.toFixed(2)}`, 150, yPosition);
    doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 180, yPosition);
    yPosition += 12;
  });

  // Payment Information Section
  const paymentY = yPosition + 20;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, paymentY, pageWidth - 30, 30, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("💳 Payment Information", 25, paymentY + 15);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Method: ${order.paymentMethod.toUpperCase()}`, 25, paymentY + 25);

  if (order.paymentDetails?.transactionId) {
    doc.text(`Transaction ID: ${order.paymentDetails.transactionId}`, 25, paymentY + 32);
  }

  // Order Summary Section
  const summaryY = paymentY + 50;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, summaryY, pageWidth - 30, 50, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("💰 Order Summary", 25, summaryY + 15);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, 120, summaryY + 25);
  doc.text(`Tax (10%): $${order.tax.toFixed(2)}`, 120, summaryY + 32);
  doc.text(`Shipping: $${order.shipping.toFixed(2)}`, 120, summaryY + 39);

  // Total with highlight
  doc.setFillColor(primaryColor);
  doc.rect(115, summaryY + 42, 80, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: $${order.total.toFixed(2)}`, 120, summaryY + 50);

  // QR Code Section - positioned properly
  const qrY = summaryY + 70;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, qrY, pageWidth - 30, 90, "F");
  
  // QR Code title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("📱 Download Receipt", 25, qrY + 15);

  try {
    const downloadUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/receipt/download/${order._id}`;
    const qrCodeDataURL = await QRCode.toDataURL(downloadUrl, {
      width: 80,
      margin: 2,
    });

    // QR Code positioned in center
    const qrCodeX = (pageWidth - 80) / 2;
    const qrCodeY = qrY + 25;
    
    // Add QR Code image
    doc.addImage(qrCodeDataURL, 'PNG', qrCodeX, qrCodeY, 80, 80);
    
    // Instructions below QR code
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor);
    doc.text("Scan with your mobile device to download this receipt", qrCodeX - 10, qrY + 90);
    
  } catch (error) {
    console.error("QR Code generation failed:", error);
  }

  // Footer Section - positioned at bottom with proper spacing
  const footerY = Math.max(pageHeight - 50, qrY + 110);
  doc.setFillColor(darkGray);
  doc.rect(0, footerY, pageWidth, 50, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business! 🎉", 20, footerY + 15);
  doc.text("For support, contact: support@ecommerce.com", 20, footerY + 25);
  doc.text("This is a computer-generated receipt.", 20, footerY + 35);

  // Add decorative border
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

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

module.exports = {
  downloadReceipt,
};


