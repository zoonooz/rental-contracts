const Migrations = artifacts.require("Migrations");
const SimpleApartmentRental = artifacts.require("SimpleApartmentRental");

module.exports = function (deployer, _, accounts) {
  deployer.deploy(Migrations);
  deployer.deploy(SimpleApartmentRental, accounts[1], 6, 8000);
};
