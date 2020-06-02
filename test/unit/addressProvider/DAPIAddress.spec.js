describe('DAPIAddress', () => {
  describe('#constructor', () => {
    it('should construct DAPIAddress from DAPIAddress');

    it('should construct DAPIAddress from host');

    it('should construct DAPIAddress with default ports');

    it('should construct DAPIAddress form RawDAPIAddress');

    it('should throw DAPIAddressHostMissingError if host is missed');
  });

  describe('#getHost', () => {
    it('should return host');
  });

  describe('#setHost', () => {
    it('should set host');
  });

  describe('#getHttpPort', () => {
    it('should get HTTP port');
  });

  describe('#setHttpPort', () => {
    it('should set HTTP port');
  });

  describe('#getGrpcPort', () => {
    it('should get HTTP port');
  });

  describe('#setGrpcPort', () => {
    it('should get HTTP port');
  });

  describe('#getProRegTxHash', () => {
    it('should get HTTP port');
  });

  describe('#getBanStartTime', () => {
    it('should get ban start time');
  });

  describe('#getBanCount', () => {
    it('should get ban count');
  });

  describe('#markAsBanned', () => {
    it('should mark address as banned');
  });

  describe('#markAsLive', () => {
    it('should mark address as live');
  });

  describe('#isBanned', () => {
    it('should return true if address is banned');
    it('should return false if address is not banned');
  });

  describe('#toJSON', () => {
    it('should return RawDAPIAddress');
  });
});
