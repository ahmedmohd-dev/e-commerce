const nodemailer = require("nodemailer");

// Create transporter (configure with your SMTP settings)
const createTransporter = () => {
  // For development, you can use Gmail, SendGrid, Mailgun, or any SMTP service
  // For production, use environment variables
  const isProduction = process.env.NODE_ENV === "production";
  // Unsafe relaxations are allowed only outside production
  const allowSelfSigned =
    !isProduction && process.env.SMTP_ALLOW_SELF_SIGNED === "true";
  const ignoreTLS = !isProduction && process.env.SMTP_IGNORE_TLS === "true";

  // Sensible defaults for demos; configurable via env
  const connectionTimeout =
    Number(process.env.SMTP_CONNECTION_TIMEOUT) || 10000; // 10s
  const greetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT) || 10000; // 10s
  const socketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT) || 20000; // 20s

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    ignoreTLS, // optionally skip STARTTLS (not recommended for production)
    tls: allowSelfSigned
      ? {
          // allow self-signed certs in dev/test only
          rejectUnauthorized: false,
        }
      : undefined,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

// Helpers
const getShortOrderId = (order) => {
  try {
    const idStr = String(order && order._id ? order._id : "");
    return idStr.slice(-8).toUpperCase();
  } catch {
    return "ORDER";
  }
};

// Email templates
const getOrderConfirmationTemplate = (order, customerEmail) => {
  return {
    subject: `Order Confirmed - MegaMart #${getShortOrderId(order)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .item { padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; color: #f97316; }
          .button { display: inline-block; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ MegaMart</h1>
            <h2>Order Confirmed!</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for your order! We've received your order and will process it shortly.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> #${getShortOrderId(order)}</p>
              <p><strong>Order Date:</strong> ${new Date(
                order.createdAt
              ).toLocaleString()}</p>
              <p><strong>Status:</strong> ${
                order.status.charAt(0).toUpperCase() + order.status.slice(1)
              }</p>
              
              <h4 style="margin-top: 20px;">Items Ordered:</h4>
              ${order.items
                .map(
                  (item) => `
                <div class="item">
                  <strong>${item.name || item.product?.name}</strong> × ${
                    item.quantity
                  }
                  <br>
                  <span style="color: #666;">ETB ${(
                    (item.price || 0) * (item.quantity || 1)
                  ).toLocaleString()}</span>
                </div>
              `
                )
                .join("")}
              
              <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #f97316;">
                <p class="total">Total: ETB ${(
                  order.totalPrice ||
                  order.total ||
                  order.amount ||
                  0
                ).toLocaleString()}</p>
              </div>
            </div>
            
            <p>You can track your order status in your profile.</p>
            <a href="${
              process.env.CLIENT_URL || "http://localhost:5173"
            }/profile" class="button">View My Orders</a>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you have any questions, please contact us at support@megamart.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

const getStatusUpdateTemplate = (order, newStatus) => {
  const statusMessages = {
    paid: "Payment received! Your order is being processed.",
    processing:
      "We've released your order to the seller. They will prepare it soon.",
    shipped: "Your order has been shipped!",
    completed: "Your order has been delivered!",
    cancelled: "Your order has been cancelled.",
  };

  return {
    subject: `Order Update - MegaMart #${getShortOrderId(order)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ MegaMart</h1>
            <h2>Order Status Update</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${
              statusMessages[newStatus] || "Your order status has been updated."
            }</strong></p>
            
            <p><strong>Order Number:</strong> #${getShortOrderId(order)}</p>
            <p><strong>New Status:</strong> ${
              newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
            }</p>
            
            <a href="${
              process.env.CLIENT_URL || "http://localhost:5173"
            }/order-tracking/${order._id}" class="button">Track Order</a>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you have any questions, please contact us at support@megamart.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Send email function
const sendEmail = async (to, subject, html) => {
  // Only send emails if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Email not configured. Skipping email to:", to);
    console.log("Subject:", subject);
    return { success: false, message: "Email not configured" };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"MegaMart" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation
exports.sendOrderConfirmation = async (order, customerEmail) => {
  const { subject, html } = getOrderConfirmationTemplate(order, customerEmail);
  return await sendEmail(customerEmail, subject, html);
};

// Send status update
exports.sendStatusUpdate = async (order, newStatus, customerEmail) => {
  const { subject, html } = getStatusUpdateTemplate(order, newStatus);
  return await sendEmail(customerEmail, subject, html);
};

// Seller application status email template
const getSellerStatusTemplate = (user, status) => {
  const statusMessages = {
    approved: {
      title: "🎉 Your Seller Application Has Been Approved!",
      message: `Congratulations! Your seller application for "${
        user.sellerProfile?.shopName || "your shop"
      }" has been approved. You can now start managing your products and orders in the Seller Dashboard.`,
      action: "Go to Seller Dashboard",
      actionUrl: "/seller",
    },
    rejected: {
      title: "Seller Application Update",
      message: `We're sorry, but your seller application for "${
        user.sellerProfile?.shopName || "your shop"
      }" was not approved at this time. You can re-apply later with additional information.`,
      action: "View Application",
      actionUrl: "/seller",
    },
  };

  const statusInfo = statusMessages[status] || {
    title: "Seller Application Update",
    message: "Your seller application status has been updated.",
    action: "View Status",
    actionUrl: "/seller",
  };

  return {
    subject: `Seller Application ${
      status === "approved" ? "Approved" : "Update"
    } - MegaMart`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .status-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${
            status === "approved" ? "#10b981" : "#ef4444"
          }; }
          .button { display: inline-block; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ MegaMart</h1>
            <h2>${statusInfo.title}</h2>
          </div>
          <div class="content">
            <p>Hello ${user.displayName || "there"},</p>
            
            <div class="status-card">
              <p>${statusInfo.message}</p>
              ${
                user.sellerProfile?.shopName
                  ? `<p><strong>Shop Name:</strong> ${user.sellerProfile.shopName}</p>`
                  : ""
              }
              <p><strong>Status:</strong> <span style="color: ${
                status === "approved" ? "#10b981" : "#ef4444"
              }; font-weight: bold;">${
      status.charAt(0).toUpperCase() + status.slice(1)
    }</span></p>
            </div>
            
            ${
              status === "approved"
                ? `<p>You can now:</p>
              <ul>
                <li>Add and manage your products</li>
                <li>View and process orders</li>
                <li>Track your sales and analytics</li>
              </ul>`
                : `<p>If you have questions about this decision or would like to provide additional information, please contact our support team.</p>`
            }
            
            <a href="${process.env.CLIENT_URL || "http://localhost:5173"}${
      statusInfo.actionUrl
    }" class="button">${statusInfo.action}</a>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you have any questions, please contact us at support@megamart.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Send seller status update email
exports.sendSellerStatusUpdate = async (user, status) => {
  const { subject, html } = getSellerStatusTemplate(user, status);
  return await sendEmail(user.email, subject, html);
};

// Dispute email templates
const getDisputeCreatedTemplate = (dispute, order, buyerEmail) => {
  return {
    subject: `Dispute Created - Order #${getShortOrderId(order)} - MegaMart`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .dispute-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
          .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ MegaMart</h1>
            <h2>Dispute Created</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We've received your dispute request. Our support team will review it shortly.</p>
            
            <div class="dispute-card">
              <h3>Dispute Details</h3>
              <p><strong>Order Number:</strong> #${getShortOrderId(order)}</p>
              <p><strong>Reason:</strong> ${dispute.reason || "N/A"}</p>
              ${
                dispute.details
                  ? `<p><strong>Details:</strong> ${dispute.details}</p>`
                  : ""
              }
              <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Open</span></p>
              <p><strong>Created:</strong> ${
                dispute.createdAt
                  ? new Date(dispute.createdAt).toLocaleString()
                  : new Date().toLocaleString()
              }</p>
            </div>
            
            <p>You can track the status of your dispute and communicate with our support team through your account.</p>
            
            <a href="${
              process.env.CLIENT_URL || "http://localhost:5173"
            }/disputes" class="button">View Dispute</a>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you have any questions, please contact us at support@megamart.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

const getDisputeUpdateTemplate = (
  dispute,
  order,
  buyerEmail,
  updateType,
  adminMessage
) => {
  const statusMessages = {
    accepted: {
      title: "Dispute Accepted",
      message:
        "Your dispute has been accepted. Our team is working on resolving it.",
      color: "#10b981",
    },
    rejected: {
      title: "Dispute Update",
      message:
        "Your dispute has been reviewed. Please see the resolution details below.",
      color: "#ef4444",
    },
    resolved: {
      title: "Dispute Resolved",
      message:
        "Your dispute has been resolved. Please see the resolution details below.",
      color: "#3b82f6",
    },
    message: {
      title: "New Message on Your Dispute",
      message:
        "You have received a new message from our support team regarding your dispute.",
      color: "#f59e0b",
    },
  };

  const statusInfo = statusMessages[updateType] || {
    title: "Dispute Update",
    message: "Your dispute has been updated.",
    color: "#6b7280",
  };

  return {
    subject: `${statusInfo.title} - Order #${getShortOrderId(
      order
    )} - MegaMart`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${
            statusInfo.color
          } 0%, ${
      statusInfo.color
    }dd 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .update-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${
            statusInfo.color
          }; }
          .message-box { background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 3px solid ${
            statusInfo.color
          }; }
          .button { display: inline-block; padding: 12px 24px; background: ${
            statusInfo.color
          }; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ MegaMart</h1>
            <h2>${statusInfo.title}</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${statusInfo.message}</strong></p>
            
            <div class="update-card">
              <h3>Dispute Information</h3>
              <p><strong>Order Number:</strong> #${getShortOrderId(order)}</p>
              <p><strong>Reason:</strong> ${dispute.reason || "N/A"}</p>
              <p><strong>Current Status:</strong> <span style="color: ${
                statusInfo.color
              }; font-weight: bold;">${
      dispute.status
        ? dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)
        : "Open"
    }</span></p>
              ${
                dispute.resolution
                  ? `<p><strong>Resolution:</strong> ${dispute.resolution}</p>`
                  : ""
              }
              <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            ${
              adminMessage
                ? `
            <div class="message-box">
              <h4>Message from Support Team:</h4>
              <p>${adminMessage}</p>
            </div>
            `
                : ""
            }
            
            ${
              updateType === "message"
                ? `
            <p>You can reply to this message through your dispute page. Our team is here to help resolve your issue.</p>
            `
                : ""
            }
            
            ${
              updateType === "resolved"
                ? `
            <p>If you have any further questions or concerns, please don't hesitate to contact our support team.</p>
            `
                : ""
            }
            
            <a href="${
              process.env.CLIENT_URL || "http://localhost:5173"
            }/disputes" class="button">View Dispute</a>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you have any questions, please contact us at support@megamart.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Send dispute created email
exports.sendDisputeCreated = async (dispute, order, buyerEmail) => {
  const { subject, html } = getDisputeCreatedTemplate(
    dispute,
    order,
    buyerEmail
  );
  return await sendEmail(buyerEmail, subject, html);
};

// Send dispute update email
exports.sendDisputeUpdate = async (
  dispute,
  order,
  buyerEmail,
  updateType,
  adminMessage
) => {
  const { subject, html } = getDisputeUpdateTemplate(
    dispute,
    order,
    buyerEmail,
    updateType,
    adminMessage
  );
  return await sendEmail(buyerEmail, subject, html);
};
