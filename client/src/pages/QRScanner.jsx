import React, { useState } from "react";

export default function QRScanner() {
  const [scannedData, setScannedData] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleQRScan = (data) => {
    try {
      // Check if it's a direct download URL
      if (data.includes('/api/receipt/download/')) {
        setDownloadUrl(data);
        setScannedData({
          type: "receipt_download",
          downloadUrl: data,
          message: "Receipt download URL detected"
        });
        // Auto-download when direct URL is detected
        setTimeout(() => {
          window.open(data, "_blank");
        }, 500);
        return;
      }
      
      // Try to parse as JSON (for backward compatibility)
      const qrData = JSON.parse(data);

      if (qrData.type === "receipt_download" && qrData.downloadUrl) {
        setScannedData(qrData);
        setDownloadUrl(qrData.downloadUrl);
      } else {
        alert("This QR code is not a receipt download code");
      }
    } catch (error) {
      // If it's not JSON, check if it's a direct URL
      if (data.includes('/api/receipt/download/')) {
        setDownloadUrl(data);
        setScannedData({
          type: "receipt_download",
          downloadUrl: data,
          message: "Receipt download URL detected"
        });
        // Auto-download when direct URL is detected
        setTimeout(() => {
          window.open(data, "_blank");
        }, 500);
      } else {
        alert("Invalid QR code format");
      }
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-qrcode me-2"></i>
                QR Code Scanner
              </h4>
            </div>
            <div className="card-body text-center">
              <div className="mb-4">
                <h5>How to use:</h5>
                <ol className="text-start">
                  <li>Open this page on your mobile device</li>
                  <li>Scan the QR code from the order confirmation page</li>
                  <li>PDF will download automatically!</li>
                </ol>
                <div className="alert alert-info">
                  <strong>Note:</strong> QR codes are only visible on desktop/tablet. 
                  Mobile users can use the direct download button on the order confirmation page.
                </div>
              </div>

              <div className="mb-4">
                <h6>Test QR Code Data:</h6>
                <p className="text-muted">
                  For testing, you can manually enter QR code data:
                </p>
                <textarea
                  className="form-control mb-3"
                  rows="2"
                  placeholder="http://localhost:5000/api/receipt/download/123"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleQRScan(e.target.value);
                    }
                  }}
                />
              </div>

               {scannedData && (
                 <div className="alert alert-success">
                   <h6>QR Code Scanned Successfully!</h6>
                   <p>
                     <strong>Order ID:</strong> {scannedData.orderId}
                   </p>
                   <p>
                     <strong>Total:</strong> ${scannedData.total}
                   </p>
                   <p>
                     <strong>Message:</strong> {scannedData.message}
                   </p>

                   <button
                     className="btn btn-primary btn-lg"
                     onClick={handleDownload}
                   >
                     <i className="fas fa-download me-2"></i>
                     Download Receipt PDF
                   </button>
                 </div>
               )}

              <div className="mt-4">
                <h6>Real QR Code Scanner:</h6>
                <p className="text-muted">
                  In a real implementation, you would use a QR code scanner
                  library like 'react-qr-scanner' or 'qr-scanner' to scan actual
                  QR codes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


