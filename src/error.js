export class AppError extends Error {
   constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
      //Error.captureStackTrace(this, this.constructor);
   }
}

export const errorHandler = (err, req, res, next) => {
   err.statusCode = err.statusCode || 500;
   err.status = err.status || 'error';

   if (process.env.NODE_ENV === 'development') {
    // Send full details for easier debugging
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production: Only send operational error details to the user
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Logic for non-operational errors (programmer bugs)
      console.error('ERROR 💥', err); // Log for internal tracking
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
   }
};