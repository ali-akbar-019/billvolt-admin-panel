// Strips any object key starting with '$' or containing '.' from req.query
// and req.body, recursively.
//
// Why: Express's default query parser (qs) turns bracket syntax into nested
// objects — e.g. `?practiceId[$ne]=null` becomes
// `req.query.practiceId = { $ne: 'null' }`. Several list endpoints assign a
// query param straight into a Mongo filter (`filter.practiceId = practiceId`),
// so without this, that string turns into a live Mongo operator and lets an
// attacker bypass the intended filter (classic NoSQL operator injection).
// This runs globally, once, instead of trusting every controller to remember
// to sanitize its own inputs.
const stripOperators = (value) => {
  if (Array.isArray(value)) {
    value.forEach(stripOperators);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        stripOperators(value[key]);
      }
    }
  }
  return value;
};

const sanitizeInput = (req, res, next) => {
  stripOperators(req.query);
  stripOperators(req.body);
  next();
};

module.exports = sanitizeInput;
