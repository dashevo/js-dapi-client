// TODO: Implement the following functions
const isHexPrefixed = () => {};
const intToBuffer = () => {};

// Return an array from a list of arguments
const toArray = (...items) => [...items];

// Return an array where json arguments are parsed into JSON.
// If JSON.parse fails, then it return a buffer in the array
const toJSON = (...items) => {
  const itemsArray = toArray(items);
  const jsonArray = itemsArray.map((item) => {
    try {
      const itemString = String(item);
      const parsedJSON = JSON.parse(itemString);
      return parsedJSON;
    } catch (error) {
      return item;
    }
  });
  return jsonArray;
};

/**
 * Attempts to turn a value into a `Buffer`. As input it supports `Buffer`, `String`, `Number`,
 * null/undefined, `BN` and other objects with a `toArray()` method.
 * @param {*} value the value
 */
const toBuffer = (value) => {
  if (!value) {
    return Buffer.allocUnsafe(0);
  }
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (typeof value === 'string') {
    if (isHexPrefixed(value)) {
      return Buffer.from(exports.padToEven(exports.stripHexPrefix(value)), 'hex');
    }
    return Buffer.from(value);
  }
  if (typeof value === 'number') {
    return intToBuffer(value);
  }
  // TODO: The following code needs to be explained or removed
  // if (value.toArray) {
  //   return Buffer.from(value.toArray());
  // }
  throw new Error('Invalid type');
};

module.exports = {
  toArray,
  toJSON,
  toBuffer,
};
