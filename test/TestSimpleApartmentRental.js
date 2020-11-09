const SimpleApartmentRental = artifacts.require("SimpleApartmentRental");

const MONTHY_AMOUNT = 8000;
const NO_OF_MONTH = 6;

contract("SimpleApartmentRental", async accounts => {

    let landlord = accounts[0];
    let tenant = accounts[1];
    let instance;
    before(async () => {
        instance = await SimpleApartmentRental.deployed();
    });

    context("when create", async () => {

        it("should have correct landlord", async () => {
            let address = await instance.landlord.call();
            expect(address).to.equal(landlord);
        });

        it("should have correct tenant", async () => {
            let address = await instance.tenant.call();
            expect(address).to.equal(tenant);
        });

        it("should have correct amount and no of month", async () => {
            let noOfMonth = await instance.noOfMonth.call();
            let amount = await instance.monthlyAmount.call();
            expect(noOfMonth.toNumber()).to.equal(NO_OF_MONTH);
            expect(amount.toNumber()).to.equal(MONTHY_AMOUNT);
        });
    });

    describe("tenant deposit", async () => {

        context("when state and amount is incorrect", async () => {

            it("should revert transaction and have zero balance", async () => {
                try {
                    await instance.deposit({ from: tenant, value: MONTHY_AMOUNT * 4 })
                    expect.fail();
                } catch (error) {
                    expect(error).to.be.an('Error');
                }
                let balance = await web3.eth.getBalance(instance.address);
                expect(balance).to.equal('0');
            });
        });

        context("when state and amount is correct", async () => {
            
            let landlordOldBalance;
            before(async () => {
                let balance = await web3.eth.getBalance(landlord);
                landlordOldBalance = web3.utils.toBN(balance);
                await instance.deposit({ from: tenant, value: MONTHY_AMOUNT * 3 });
            });

            it("should have correct balance", async () => {
                let balance = await web3.eth.getBalance(instance.address);
                expect(balance).to.equal(MONTHY_AMOUNT * 2 + '');
            });

            it("should send correct amount to landlord", async () => {
                let balance = await web3.eth.getBalance(landlord);
                let actual = web3.utils.toBN(balance) + '';
                let expected = landlordOldBalance.add(web3.utils.toBN(MONTHY_AMOUNT)) + '';
                expect(actual).to.equal(expected);
            });
        });
    });
});