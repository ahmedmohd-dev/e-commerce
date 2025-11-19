const STATUS_FLOW = ["pending", "paid", "processing", "shipped", "completed"];
const STATUS_ORDER = [...STATUS_FLOW, "cancelled"];
const SELLER_SEQUENCE = ["processing", "shipped", "completed"];
const TERMINAL_STATUSES = ["completed", "cancelled"];

const STATUS_LABELS = {
  pending: "Pending (Awaiting Telebirr verification)",
  paid: "Paid (Verified by admin)",
  processing: "Processing (Released to seller)",
  shipped: "Shipped",
  completed: "Completed / Delivered",
  cancelled: "Cancelled",
};

const getStatusIndex = (status) => STATUS_ORDER.indexOf(status);

const isValidStatus = (status) => STATUS_ORDER.includes(status);

const isTerminalStatus = (status) => TERMINAL_STATUSES.includes(status);

const canAdminTransition = (current, next) => {
  if (!next) {
    return { allowed: false, reason: "Status is required" };
  }
  if (!isValidStatus(next)) {
    return { allowed: false, reason: "Invalid status" };
  }
  if (current === next) {
    return { allowed: true };
  }
  if (isTerminalStatus(current)) {
    return {
      allowed: false,
      reason: "Completed or cancelled orders are locked",
    };
  }
  if (next === "cancelled" && current !== "completed") {
    return { allowed: true };
  }

  const currentIndex = getStatusIndex(current);
  const nextIndex = getStatusIndex(next);

  if (currentIndex === -1) {
    return { allowed: false, reason: "Unknown current status" };
  }
  if (nextIndex < currentIndex) {
    return {
      allowed: false,
      reason: "Cannot move backward in the order timeline",
    };
  }

  return { allowed: true };
};

const canSellerTransition = (
  current,
  next,
  { paymentVerified = false } = {}
) => {
  if (!next) {
    return { allowed: false, reason: "Status is required" };
  }
  if (!isValidStatus(next)) {
    return { allowed: false, reason: "Invalid status" };
  }
  if (
    !(
      SELLER_SEQUENCE.includes(next) ||
      (current === "paid" && next === "processing")
    )
  ) {
    return {
      allowed: false,
      reason: "Only shipping statuses can be updated by sellers",
    };
  }
  if (!paymentVerified) {
    return {
      allowed: false,
      reason: "Admin must verify payment before updating status",
    };
  }
  if (isTerminalStatus(current)) {
    return { allowed: false, reason: "Order is locked" };
  }
  if (current === "paid" && next === "processing") {
    return { allowed: true };
  }
  if (!SELLER_SEQUENCE.includes(current)) {
    return {
      allowed: false,
      reason: "Wait for admin to release the order to processing",
    };
  }
  if (current === next) {
    return { allowed: true };
  }

  const currentIndex = SELLER_SEQUENCE.indexOf(current);
  const nextIndex = SELLER_SEQUENCE.indexOf(next);

  if (nextIndex <= currentIndex) {
    return {
      allowed: false,
      reason: "Cannot move backward in the delivery timeline",
    };
  }

  // Enforce single-step progression (Processing -> Shipped -> Completed)
  if (nextIndex - currentIndex > 1) {
    return {
      allowed: false,
      reason: "You must ship the order before marking it as delivered",
    };
  }

  return { allowed: true };
};

const getNextSellerStatus = (current) => {
  if (current === "paid") return "processing";
  const currentIndex = SELLER_SEQUENCE.indexOf(current);
  if (currentIndex === -1) return null;
  return SELLER_SEQUENCE[currentIndex + 1] || null;
};

module.exports = {
  STATUS_FLOW,
  STATUS_ORDER,
  STATUS_LABELS,
  SELLER_SEQUENCE,
  TERMINAL_STATUSES,
  isTerminalStatus,
  canAdminTransition,
  canSellerTransition,
  getNextSellerStatus,
};
