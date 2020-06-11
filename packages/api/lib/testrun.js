class TestCaseRun {
  constructor (okMessage, number, name) {
    this.successful = (okMessage === 'ok');
    this.number = number;
    this.name = name;
    this.encodedName = encodeURIComponent(this.name);
    this.failureMessage = 'TODO ERROR MESSAGE, (e.g. stackoverflow error line 13)';
  }

  display () {
    return this.number + ', ' + this.name + ', ' + this.time + ', ' + (this.successful ? '1' : '0');
  }
}

module.exports = TestCaseRun;
