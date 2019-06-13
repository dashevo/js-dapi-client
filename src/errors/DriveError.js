class DriveError extends Error {
  constructor(...params) {
    super(...params);

    this.name = this.constructor.name;
  }
}

module.exports = DriveError;
