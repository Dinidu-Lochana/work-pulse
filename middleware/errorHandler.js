function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "A record with these details already exists" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid id" });
  }

  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
}

module.exports = { notFound, errorHandler };
