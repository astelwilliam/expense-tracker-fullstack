// Validate public API inputs independently from the database.
// Never pass a request body directly to MongoDB queries or updates.
export function validateSignup(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid request body" };
  }
  const { name, email, password } = body;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return { error: "Name must be between 1 and 80 characters" };
  }
  if (typeof email !== "string" || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { error: "Valid email is required" };
  }
  // bcrypt hashes at most 72 bytes; reject passwords that would be truncated.
  if (typeof password !== "string" || password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72) {
    return { error: "Password must be at least 8 characters and at most 72 bytes" };
  }
  return { value: { name: name.trim(), email: email.trim().toLowerCase(), password } };
}

export function validateLogin(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid request body" };
  }
  const { email, password } = body;
  if (typeof email !== "string" || !email.trim() || email.length > 254 ||
      typeof password !== "string" || !password) {
    return { error: "Email and password are required" };
  }
  return { value: { email: email.trim().toLowerCase(), password } };
}

export function validateTransaction(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid transaction body" };
  }
  const { title, amount, category, transactionDate, type, referenceId } = body;
  if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
    return { error: "Title must be between 1 and 120 characters" };
  }
  // Signed amount: positive income, negative expense; use two decimal places at most.
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount === 0 ||
      Math.abs(amount) > 1_000_000_000 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) {
    return { error: "Amount must be nonzero, finite, and have up to two decimals" };
  }
  if (typeof category !== "string" || !category.trim() || category.trim().length > 50 || /[\u0000-\u001f]/.test(category)) {
    return { error: "Category must be between 1 and 50 safe characters" };
  }
  const derivedType = amount > 0 ? "income" : "expense";
  if (type !== undefined && (type !== "income" && type !== "expense")) {
    return { error: "Type must be income or expense" };
  }
  if (type !== undefined && type !== derivedType) {
    return { error: "Type must match the signed amount" };
  }
  // Calendar date (YYYY-MM-DD), not a timestamp; avoid local timezone shifts.
  // Missing dates are allowed for old API clients and existing records.
  if (transactionDate !== undefined) {
    if (typeof transactionDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      return { error: "Date must be in YYYY-MM-DD format" };
    }
    const parsed = new Date(`${transactionDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== transactionDate) {
      return { error: "Choose a valid calendar date" };
    }
  }
  if (referenceId !== undefined && (typeof referenceId !== "string" || !/^[A-Za-z0-9_-]{6,80}$/.test(referenceId.trim()))) {
    return { error: "Reference ID must be 6-80 letters, numbers, underscores, or hyphens" };
  }
  return {
    value: {
      title: title.trim(),
      amount: Math.round(amount * 100) / 100,
      category: category.trim(),
      type: derivedType,
      ...(transactionDate === undefined ? {} : { transactionDate }),
      // Canonical form makes duplicate checks and a future unique index case-insensitive.
      ...(referenceId === undefined ? {} : { referenceId: referenceId.trim().toUpperCase() }),
    },
  };
}
