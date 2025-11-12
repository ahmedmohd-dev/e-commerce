import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchContactOverview,
  fetchContactThread,
  sendContactMessage,
} from "../api/contactApi";
import { fetchDispute } from "../api/orderApi";
import { uploadMultipleToCloudinary } from "../utils/cloudinary";

export default function ContactSellerPage() {
  const { orderId } = useParams();
  const [overview, setOverview] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [dispute, setDispute] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchContactOverview(orderId);
        setOverview(data);
        if (data.sellers?.length) {
          setSelectedSeller(String(data.sellers[0].sellerId));
        }
        const existingDispute = await fetchDispute(orderId).catch(() => null);
        setDispute(existingDispute);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  useEffect(() => {
    async function loadThread() {
      if (!selectedSeller) {
        setThread(null);
        return;
      }
      setLoadingThread(true);
      try {
        const data = await fetchContactThread(orderId, selectedSeller);
        setThread(data);
      } finally {
        setLoadingThread(false);
      }
    }
    if (selectedSeller) loadThread();
  }, [orderId, selectedSeller]);

  const sortedMessages = useMemo(() => {
    if (!thread?.messages) return [];
    return [...thread.messages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [thread]);

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const onSend = async (e) => {
    e.preventDefault();
    if (!selectedSeller) return;
    if (!message.trim() && files.length === 0) {
      window.alert("Please provide a message or upload proof.");
      return;
    }
    setSending(true);
    try {
      let attachments = [];
      if (files.length) {
        attachments = await uploadMultipleToCloudinary(files);
      }
      await sendContactMessage(orderId, {
        sellerId: selectedSeller,
        message: message.trim(),
        attachments,
      });
      const data = await fetchContactThread(orderId, selectedSeller);
      setThread(data);
      setMessage("");
      setFiles([]);
    } catch (err) {
      console.error("Failed to send message:", err);
      window.alert(
        err?.response?.data?.message ||
          "Failed to send message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center mb-3">
        <h3 className="mb-0">Contact Seller</h3>
        <span className="ms-2 badge badge-info">Pre-dispute</span>
      </div>

      <div className="mb-3">
        <Link to="/profile" className="btn btn-link">
          &larr; Back to Profile
        </Link>
        <Link
          to={`/disputes/new/${orderId}`}
          className="btn btn-outline-danger ms-2"
        >
          Go to Dispute Form
        </Link>
        {dispute && (
          <span className="badge bg-warning text-dark ms-2">
            Dispute already raised
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : !overview?.sellers?.length ? (
        <div className="alert alert-info">No sellers found for this order.</div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white">
                <strong>Select Seller</strong>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Seller</label>
                  <select
                    className="form-select"
                    value={selectedSeller}
                    onChange={(e) => setSelectedSeller(e.target.value)}
                  >
                    {overview.sellers.map((seller) => (
                      <option key={seller.sellerId} value={seller.sellerId}>
                        {seller.shopName || seller.sellerEmail || "Seller"} (
                        {seller.productNames.join(", ")})
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Choose which seller you want to contact about this order.
                  </div>
                </div>
                {selectedSeller && (
                  <div className="small text-muted">
                    Order placed on{" "}
                    {new Date(overview.order.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white d-flex justify-content-between">
                <strong>Conversation</strong>
                {thread?.seller?.shopName && (
                  <span className="badge bg-light text-dark">
                    {thread.seller.shopName}
                  </span>
                )}
              </div>
              <div className="card-body d-flex flex-column">
                {loadingThread ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex-grow-1 mb-3">
                      {sortedMessages.length === 0 ? (
                        <div className="text-muted">
                          No messages yet. Start the conversation using the form
                          below.
                        </div>
                      ) : (
                        <div className="list-group">
                          {sortedMessages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`list-group-item border-0 border-start border-4 ${
                                msg.sender === "buyer"
                                  ? "border-primary bg-light"
                                  : "border-success"
                              }`}
                            >
                              <div className="d-flex justify-content-between">
                                <span className="fw-bold text-capitalize">
                                  {msg.sender}
                                </span>
                                <small className="text-muted">
                                  {new Date(msg.createdAt).toLocaleString()}
                                </small>
                              </div>
                              {msg.body && (
                                <div className="mt-2">{msg.body}</div>
                              )}
                              {msg.attachments?.length > 0 && (
                                <div className="mt-2 d-flex flex-wrap gap-2">
                                  {msg.attachments.map((att, index) => (
                                    <a
                                      key={index}
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-sm btn-outline-primary"
                                    >
                                      <i className="fas fa-paperclip me-1"></i>
                                      Attachment {index + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <form onSubmit={onSend}>
                      <div className="mb-3">
                        <label className="form-label">Message</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Explain your concern or question..."
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          Upload proof (optional)
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          multiple
                          onChange={handleFilesChange}
                        />
                        {files.length > 0 && (
                          <div className="form-text">
                            {files.length} file
                            {files.length > 1 ? "s" : ""} selected
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={sending}
                      >
                        {sending ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-1"></i>
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


