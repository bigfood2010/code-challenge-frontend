var validateInput = function (n) {
  if (!Number.isInteger(n) || n <= 0) {
    throw new RangeError("n must be a positive integer");
  }
};

var sum_to_n_a = function (n) {
  validateInput(n);
  return (n * (n + 1)) / 2;
};

var sum_to_n_b = function (n) {
  validateInput(n);
  var total = 0;
  for (var i = 1; i <= n; i += 1) {
    total += i;
  }
  return total;
};

var sum_to_n_c = function (n) {
  validateInput(n);

  var recursiveSum = function (value) {
    if (value === 1) {
      return 1;
    }
    return value + recursiveSum(value - 1);
  };

  return recursiveSum(n);
};
