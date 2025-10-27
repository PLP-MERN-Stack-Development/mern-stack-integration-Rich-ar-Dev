// Wrap async route handlers to forward errors to express error middleware
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
