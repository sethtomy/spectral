const { hasIn } = require('lodash-es');

module.exports = (targetVal, opts) => {
  if (!hasIn(targetVal, opts.path)) {
    return [
      {
        message: `Object does not have ${opts.prop} property`,
      },
    ];
  }
};
