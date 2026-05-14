export default function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.keys(err.errors).map(field => ({
      field,
      message: err.errors[field].message
    }));
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fields: errors
      }
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field} already exists`
      }
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID_FORMAT',
        message: 'Invalid ID format'
      }
    });
  }

  // Handle custom errors with status
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code || 'ERROR',
        message: err.message
      }
    });
  }

  // Default to 500
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
}