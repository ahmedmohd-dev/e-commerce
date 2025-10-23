import React, { useState, useEffect } from "react";
import { generateReceiptDownloadQRCode } from "../utils/receiptGenerator";

export default function ReceiptPreview({ order, showQRCode = true }) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);

  useEffect(() => {
    const generateQRCode = async () => {
      if (showQRCode && order) {
        setQrCodeLoading(true);
        try {
          const qrCode = await generateReceiptDownloadQRCode(order);
          setQrCodeDataURL(qrCode);
        } catch (error) {
          console.error("QR Code generation failed:", error);
        } finally {
          setQrCodeLoading(false);
        }
      }
    };

    generateQRCode();
  }, [order, showQRCode]);

  if (!order) return null;

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-light">
        <h5 className="mb-0">
          <i className="fas fa-receipt me-2"></i>
          Order Receipt Preview
        </h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-8">
            <div className="receipt-info">
              <div className="row mb-2">
                <div className="col-6">
                  <strong>Order #:</strong> {order._id.slice(-8).toUpperCase()}
                </div>
                <div className="col-6">
                  <strong>Date:</strong>{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="row mb-2">
                <div className="col-6">
                  <strong>Status:</strong>
                  <span
                    className={`badge bg-${getStatusColor(order.status)} ms-2`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </div>
                <div className="col-6">
                  <strong>Total:</strong> ${order.total.toFixed(2)}
                </div>
              </div>

              <div className="mb-2">
                <strong>Customer:</strong> {order.shippingAddress.firstName}{" "}
                {order.shippingAddress.lastName}
              </div>

              <div className="mb-2">
                <strong>Payment Method:</strong>{" "}
                {order.paymentMethod.toUpperCase()}
              </div>

              {order.paymentDetails?.transactionId && (
                <div className="mb-2">
                  <strong>Transaction ID:</strong>{" "}
                  {order.paymentDetails.transactionId}
                </div>
              )}
            </div>
          </div>

          {showQRCode && (
            <div className="col-md-4 d-none d-md-block">
              <div className="text-center">
                <h6 className="mb-2">Download Receipt QR Code</h6>
                
                <small className="text-muted mb-2 d-block">
                  🌐 Anyone can scan and download
                </small>
                <small className="text-muted mb-2 d-block">
                  📱 Desktop/Tablet only - Mobile users can use direct download
                </small>
                {qrCodeLoading ? (
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ height: "120px" }}
                  >
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">
                        Generating QR Code...
                      </span>
                    </div>
                  </div>
                ) : qrCodeDataURL ? (
                  <div className="border rounded p-2 bg-white">
                    <img
                      src={qrCodeDataURL}
                      alt="Order QR Code"
                      className="img-fluid"
                      style={{ maxWidth: "120px" }}
                    />
                  </div>
                ) : (
                  <div className="text-muted">QR Code not available</div>
                )}
                <small className="text-muted mt-2 d-block">
                  Scan to download receipt PDF
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "confirmed":
      return "info";
    case "shipped":
      return "primary";
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "secondary";
  }
};
