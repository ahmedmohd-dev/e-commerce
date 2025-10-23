import React, { useState } from "react";

export default function QRScanner() {
  const [scannedData, setScannedData] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleQRScan = (data) => {
    try {
      const qrData = JSON.parse(data);

      if (qrData.type === "receipt_download" && qrData.downloadUrl) {
        setScannedData(qrData);
        setDownloadUrl(qrData.downloadUrl);
      } else {
        alert("This QR code is not a receipt download code");
      }
    } catch (error) {
      alert("Invalid QR code format");
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // If it requires auth, check if user is logged in
      if (scannedData?.requireAuth) {
        // Check if user is authenticated (you can implement this check)
        const isAuthenticated = localStorage.getItem('firebaseToken'); // Simple check
        
        if (!isAuthenticated) {
          alert("This QR code requires login. Please log in first.");
          return;
        }
      }
      
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
                  <li>Click the download button to get the receipt PDF</li>
                </ol>
              </div>

              <div className="mb-4">
                <h6>Test QR Code Data:</h6>
                <p className="text-muted">
                  For testing, you can manually enter QR code data:
                </p>
                <textarea
                  className="form-control mb-3"
                  rows="4"
                  placeholder='{"type":"receipt_download","orderId":"123","downloadUrl":"http://localhost:5000/api/receipt/download/123","total":150,"timestamp":"2024-01-01T00:00:00.000Z","message":"Scan to download receipt PDF"}'
                  onChange={(e) => {
                    if (e.target.value) {
                      handleQRScan(e.target.value);
                    }
                  }}
                />
              </div>

               {scannedData && (
                 <div className={`alert ${scannedData.requireAuth ? 'alert-warning' : 'alert-success'}`}>
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
                   <p>
                     <strong>Security:</strong> 
                     {scannedData.requireAuth ? (
                       <span className="text-warning"> 🔒 Requires Login</span>
                     ) : (
                       <span className="text-success"> 🌐 Public Access</span>
                     )}
                   </p>

                   <button
                     className={`btn btn-lg ${scannedData.requireAuth ? 'btn-warning' : 'btn-primary'}`}
                     onClick={handleDownload}
                   >
                     <i className="fas fa-download me-2"></i>
                     {scannedData.requireAuth ? 'Download (Login Required)' : 'Download Receipt PDF'}
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


