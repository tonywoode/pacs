'use strict'
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinonChai = require("sinon-chai")

chai.use(chaiAsPromised)
chai.use(sinonChai)

global.sinon = require('sinon')
global.expect = chai.expect
