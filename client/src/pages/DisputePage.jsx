import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  createDispute,
  fetchDispute,
  fetchMyDisputes,
  sendDisputeMessage,
} from "../api/orderApi";
import { useAuth } from "../contexts/AuthContext";
import { uploadMultipleToCloudinary } from "../utils/cloudinary";

const COMMON_REASONS = [
  "Payment not approved in time",
  "Seller did not deliver",
  "Received wrong item",
  "Item missing or incomplete",
  "Item arrived damaged",
  "Other",
];

export default function DisputePage() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [initialFiles, setInitialFiles] = useState([]);
  const [initialBusy, setInitialBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [existing, setExisting] = useState(null);
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyBusy, setReplyBusy] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingList(true);
      try {
        const [mine, byOrder] = await Promise.all([
          fetchMyDisputes(),
          orderId ? fetchDispute(orderId) : Promise.resolve(null),
        ]);
        setList(mine || []);
        setExisting(byOrder);
      } finally {
        setLoadingList(false);
      }
    }
    if (user) load();
  }, [user, orderId]);

  const canSubmit = useMemo(() => {
    if (!orderId) return false;
    if (!reason) return false;
    if (reason === "Other" && !details.trim()) return false;
    if (existing) return false;
    return true;
  }, [orderId, reason, details, existing]);

  const canReply = useMemo(() => {
    if (!existing) return false;
    if (existing.status === "resolved") return false;
    const hasText = replyText.trim().length > 0;
    const hasFiles = replyFiles.length > 0;
    return hasText || hasFiles;
  }, [existing, replyText, replyFiles]);

  const sortedMessages = useMemo(() => {
    if (!existing?.messages) return [];
    return [...existing.messages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [existing]);

  const refreshData = async () => {
    const [mine, byOrder] = await Promise.all([
      fetchMyDisputes(),
      orderId ? fetchDispute(orderId) : Promise.resolve(null),
    ]);
    setList(mine || []);
    setExisting(byOrder);
  };

  const handleInitialFilesChange = (e) => {
    setInitialFiles(Array.from(e.target.files || []));
  };

  const handleReplyFilesChange = (e) => {
    setReplyFiles(Array.from(e.target.files || []));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const finalReason = reason === "Other" ? details.trim() : reason;
      const extraDetails = reason === "Other" ? "" : details.trim();
      let attachments = [];
      if (initialFiles.length) {
        setInitialBusy(true);
        attachments = await uploadMultipleToCloudinary(initialFiles);
      }

      await createDispute(orderId, {
        reason: finalReason,
        details: extraDetails,
        attachments,
      });
      await refreshData();
      setReason("");
      setDetails("");
      setInitialFiles([]);
    } catch (err) {
      console.error("Failed to submit dispute:", err);
      window.alert(
        err?.response?.data?.message ||
          "Failed to submit dispute. Please try again."
      );
    } finally {
      setSubmitting(false);
      setInitialBusy(false);
    }
  };

  const onReply = async (e) => {
    e.preventDefault();
    if (!canReply) return;
    setReplyBusy(true);
    try {
      let attachments = [];
      if (replyFiles.length) {
        attachments = await uploadMultipleToCloudinary(replyFiles);
      }
      await sendDisputeMessage(orderId, {
        message: replyText.trim(),
        attachments,
      });
      await refreshData();
      setReplyText("");
      setReplyFiles([]);
    } catch (err) {
      console.error("Failed to send message:", err);
      window.alert(
        err?.response?.data?.message ||
          "Failed to send message. Please try again."
      );
    } finally {
      setReplyBusy(false);
    }
  };

  const renderMessages = () => {
    if (!existing) return null;
    if (sortedMessages.length === 0) {
      return (
        <div className="text-muted small">
          No messages yet. Use the form below to start the conversation.
        </div>
      );
    }
    return (
      <div className="list-group">
        {sortedMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`list-group-item border-0 border-start border-4 ${
              msg.sender === "buyer"
                ? "border-primary bg-light"
                : msg.sender === "admin"
                ? "border-success"
                : "border-warning"
            }`}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold text-capitalize">{msg.sender}</span>
              <small className="text-muted">
                {new Date(msg.createdAt).toLocaleString()}
              </small>
            </div>
            {msg.body && <div className="mt-2">{msg.body}</div>}
            {msg.attachments?.length ? (
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
                    Proof {index + 1}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center mb-3">
        <h3 className="mb-0">Disputes</h3>
        <span className="ms-2 badge badge-orange">Help Center</span>
      </div>

      {orderId && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <strong>
              Raise a Dispute for Order #{String(orderId).slice(-8)}
            </strong>
          </div>
          <div className="card-body">
            {!existing ? (
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label">Select a reason</label>
                  <select
                    className="form-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="">Choose...</option>
                    {COMMON_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    {reason === "Other"
                      ? "Describe the issue"
                      : "Additional details (optional)"}
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={
                      reason === "Other"
                        ? "Please describe your issue in detail"
                        : "Add any details that might help us resolve your issue faster"
                    }
                  />
                  {reason === "Other" && !details.trim() && (
                    <div className="form-text text-danger">
                      Please provide a description for 'Other'
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Upload proof (optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    onChange={handleInitialFilesChange}
                  />
                  {initialFiles.length > 0 && (
                    <div className="form-text">
                      {initialFiles.length} file
                      {initialFiles.length > 1 ? "s" : ""} selected
                    </div>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!canSubmit || submitting || initialBusy}
                  >
                    {submitting || initialBusy ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-1"></i>
                        Submit Dispute
                      </>
                    )}
                  </button>
                  <Link to="/profile" className="btn btn-light">
                    Cancel
                  </Link>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-3">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="badge bg-secondary">
                      Status: {existing.status?.toUpperCase()}
                    </span>
                    <small className="text-muted">
                      Created: {new Date(existing.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>
                <div className="mb-3">
                  <strong>Reason:</strong> {existing.reason}
                  {existing.details && (
                    <div className="text-muted small mt-1">
                      Details: {existing.details}
                    </div>
                  )}
                </div>
                {existing.resolution && (
                  <div className="alert alert-success py-2">
                    <strong>Resolution:</strong> {existing.resolution}
                  </div>
                )}
                <hr />
                <div className="mb-3">
                  <h6 className="fw-bold">Conversation</h6>
                  {renderMessages()}
                </div>
                {existing.status === "resolved" ? (
                  <div className="alert alert-success">
                    This dispute has been marked as resolved. If you still need
                    assistance, please contact support or open a new dispute.
                  </div>
                ) : (
                  <form onSubmit={onReply}>
                    <div className="mb-3">
                      <label className="form-label">Send a reply</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your message here..."
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Attach proof (optional)
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        multiple
                        onChange={handleReplyFilesChange}
                      />
                      {replyFiles.length > 0 && (
                        <div className="form-text">
                          {replyFiles.length} file
                          {replyFiles.length > 1 ? "s" : ""} selected
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={!canReply || replyBusy}
                    >
                      {replyBusy ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-1"></i>
                          Send Reply
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <strong>Your Disputes</strong>
        </div>
        <div className="card-body">
          {loadingList ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : list.length === 0 ? (
            <div className="text-muted">You have no disputes.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Created</th>
                    <th>Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <code>
                          #{String(d.order?._id || d.order).slice(-8)}
                        </code>
                        <div className="text-muted small">
                          {d.order?.status || "-"}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {String(d.status || "").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="fw-bold">{d.reason}</div>
                        {d.details && (
                          <div className="text-muted small">{d.details}</div>
                        )}
                      </td>
                      <td>{new Date(d.createdAt).toLocaleString()}</td>
                      <td>
                        {d.resolution ? (
                          <span className="text-success">{d.resolution}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
