const { expect, use } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const dirtyChai = require('dirty-chai');
const chaiAsPromised = require('chai-as-promised');
const DriveApiOptions = require('@dashevo/dp-services-ctl/lib/services/drive/api/DriveApiOptions');
const DapiCoreOptions = require('@dashevo/dp-services-ctl/lib/services/dapi/core/DapiCoreOptions');
const DapiTxFilterStreamOptions = require('@dashevo/dp-services-ctl/lib/services/dapi/txFilterStream/DapiTxFilterStreamOptions');
const DashCoreOptions = require('@dashevo/dp-services-ctl/lib/services/dashCore/DashCoreOptions');
const InsightApiOptions = require('@dashevo/dp-services-ctl/lib/services/insightApi/InsightApiOptions');

use(sinonChai);
use(chaiAsPromised);
use(dirtyChai);

if (process.env.SERVICE_IMAGE_CORE) {
    DashCoreOptions.setDefaultCustomOptions({
        container: {
            image: process.env.SERVICE_IMAGE_CORE,
        },
    });
}

if (process.env.SERVICE_IMAGE_DAPI) {
    DapiCoreOptions.setDefaultCustomOptions({
        container: {
            image: process.env.SERVICE_IMAGE_DAPI,
        },
    });
    DapiTxFilterStreamOptions.setDefaultCustomOptions({
        container: {
            image: process.env.SERVICE_IMAGE_DAPI,
        },
    });
}

if (process.env.SERVICE_IMAGE_INSIGHT) {
    InsightApiOptions.setDefaultCustomOptions({
        container: {
            image: process.env.SERVICE_IMAGE_INSIGHT,
        },
    });
}

if (process.env.SERVICE_IMAGE_DRIVE) {
    DriveApiOptions.setDefaultCustomOptions({
        container: {
            image: process.env.SERVICE_IMAGE_DRIVE,
        },
    });
}

beforeEach(function beforeEach() {
  if (!this.sinon) {
    this.sinon = sinon.createSandbox();
  } else {
    this.sinon.restore();
  }
});

afterEach(function afterEach() {
  this.sinon.restore();
});

global.expect = expect;
