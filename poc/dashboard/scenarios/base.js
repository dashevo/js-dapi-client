const Api = require('../../../src/api');

class BaseScenario {
  constructor() {
    this.api = new Api();
    this.intervalIds = null;
    this.answers = [];
  }

  init() {
    this.intervalIds = [];
  }

  clearIntervals() {
    this.intervalIds.forEach(e => clearInterval(e));
  }

  getOutput() {
    return `no UI spesified for this test, Interval Events = ${this.intervalEvents}`;
  }

  setAnswers(answers) {
    this.answers = answers;
  }
}

module.exports = BaseScenario;
