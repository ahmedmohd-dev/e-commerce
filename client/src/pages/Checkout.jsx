import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import http from "../api/http";
import { generatePaymentQRCode } from "../utils/receiptGenerator";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("telebirr");
  const [telebirrTransactionId, setTelebirrTransactionId] = useState("");
  const [qrCodeDataURL, setQrCodeDataURL] = useState(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Ethiopia",
    notes: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate QR code for Telebirr payment
  useEffect(() => {
    const generateQRCode = async () => {
      if (paymentMethod === "telebirr" && items.length > 0) {
        setQrCodeLoading(true);
        try {
          const paymentData = {
            amount: getTotalPrice() * 1.1,
            phone: "+251 9XX XXX XXX",
            description: `Payment for ${items.length} item(s)`,
          };
          const qrCode = await generatePaymentQRCode(paymentData);
          setQrCodeDataURL(qrCode);
        } catch (error) {
          console.error("QR Code generation failed:", error);
        } finally {
          setQrCodeLoading(false);
        }
      } else {
        setQrCodeDataURL(null);
      }
    };

    generateQRCode();
  }, [paymentMethod, items, getTotalPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        user: user.uid,
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        paymentMethod,
        paymentDetails:
          paymentMethod === "telebirr"
            ? {
                transactionId: telebirrTransactionId,
                status: "pending",
              }
            : {
                status: "pending",
              },
        subtotal: getTotalPrice(),
        tax: getTotalPrice() * 0.1,
        total: getTotalPrice() * 1.1,
        status: "pending",
        notes: formData.notes,
      };

      const response = await http.post("/api/orders", orderData);

      // Clear cart and redirect to confirmation
      clearCart();
      navigate(`/order-confirmation/${response.data._id}`);
    } catch (error) {
      console.error("Order creation failed:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <i className="fas fa-shopping-cart fa-4x text-muted mb-4"></i>
                <h3 className="text-muted">Your cart is empty</h3>
                <p className="text-muted mb-4">
                  Add some products to your cart before checkout.
                </p>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate("/products")}
                >
                  <i className="fas fa-shopping-bag me-2"></i>
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h1 className="display-6 fw-bold mb-4">Checkout</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Shipping Information */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-shipping-fast me-2"></i>
                  Shipping Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street address, apartment, suite, etc."
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">State/Region *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">ZIP Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Country *</label>
                  <select
                    className="form-select"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Ethiopia">Ethiopia</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Tanzania">Tanzania</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Order Notes</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Special instructions for your order..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-credit-card me-2"></i>
                  Payment Method
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="telebirr"
                        value="telebirr"
                        checked={paymentMethod === "telebirr"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="telebirr">
                        <i className="fas fa-mobile-alt me-2"></i>
                        Telebirr
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="paypal"
                        value="paypal"
                        checked={paymentMethod === "paypal"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="paypal">
                        <i className="fab fa-paypal me-2"></i>
                        PayPal (Coming Soon)
                      </label>
                    </div>
                  </div>
                </div>

                {paymentMethod === "telebirr" && (
                  <div className="alert alert-info">
                    <h6>
                      <i className="fas fa-info-circle me-2"></i>Telebirr
                      Payment Instructions:
                    </h6>

                    {/* QR Code Section */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <div className="text-center">
                          <h6 className="mb-2">Scan QR Code to Pay</h6>
                          {qrCodeLoading ? (
                            <div
                              className="d-flex justify-content-center align-items-center"
                              style={{ height: "200px" }}
                            >
                              <div
                                className="spinner-border text-primary"
                                role="status"
                              >
                                <span className="visually-hidden">
                                  Generating QR Code...
                                </span>
                              </div>
                            </div>
                          ) : qrCodeDataURL ? (
                            <div className="border rounded p-2 bg-white">
                              <img
                                src={qrCodeDataURL}
                                alt="Payment QR Code"
                                className="img-fluid"
                                style={{ maxWidth: "150px" }}
                              />
                            </div>
                          ) : (
                            <div className="text-muted">
                              QR Code not available
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="payment-instructions">
                          <h6 className="mb-2">Manual Payment</h6>
                          <ol className="mb-2">
                            <li>
                              Send payment to: <strong>+251 9XX XXX XXX</strong>
                            </li>
                            <li>
                              Amount:{" "}
                              <strong>
                                ${(getTotalPrice() * 1.1).toFixed(2)}
                              </strong>
                            </li>
                            <li>
                              Enter the transaction ID below after payment
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Transaction ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={telebirrTransactionId}
                        onChange={(e) =>
                          setTelebirrTransactionId(e.target.value)
                        }
                        placeholder="Enter Telebirr transaction ID"
                        required
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "paypal" && (
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    PayPal integration coming soon! Please use Telebirr for now.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div
              className="card border-0 shadow-sm sticky-top"
              style={{ top: "20px" }}
            >
              <div className="card-header bg-light">
                <h5 className="mb-0">Order Summary</h5>
              </div>
              <div className="card-body">
                {items.map((item) => (
                  <div
                    key={item.product._id}
                    className="d-flex justify-content-between align-items-center mb-3"
                  >
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{item.product.name}</h6>
                      <small className="text-muted">Qty: {item.quantity}</small>
                    </div>
                    <span className="fw-bold">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                <hr />

                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>Tax (10%)</span>
                  <span>${(getTotalPrice() * 0.1).toFixed(2)}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping</span>
                  <span className="text-success">Free</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-4">
                  <span className="h5 fw-bold">Total</span>
                  <span className="h5 fw-bold text-primary">
                    ${(getTotalPrice() * 1.1).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100"
                  disabled={
                    loading ||
                    (paymentMethod === "telebirr" && !telebirrTransactionId)
                  }
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-credit-card me-2"></i>
                      Place Order
                    </>
                  )}
                </button>

                <div className="mt-3 text-center">
                  <small className="text-muted">
                    <i className="fas fa-shield-alt me-1"></i>
                    Secure checkout with SSL encryption
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
