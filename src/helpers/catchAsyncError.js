// this function is used for catch error in controller
module.exports = (theAsyncErrorFunction) => {
  return (req, res, next) => {
    theAsyncErrorFunction(req, res, next).catch(next);
  };
};
