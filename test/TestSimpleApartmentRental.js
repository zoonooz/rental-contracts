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

        context("when amount is incorrect", async () => {

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

        context("when amount is correct", async () => {
            
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

            it("should update state", async () => {
                let state = await instance.state.call();
                expect(state.toNumber()).to.equal(1); // Active
            });
        });
    });

    describe("tenant pay rent", async () => {

        context("when amount is incorrect", async () => {

            it("should revert transaction", async () => {
                try {
                    await instance.payRent({ from: tenant, value: MONTHY_AMOUNT + 100 })
                    expect.fail();
                } catch (error) {
                    expect(error).to.be.an('Error');
                }
            });
        });

        context("when amount is correct", async () => {

            let landlordOldBalance;
            before(async () => {
                let balance = await web3.eth.getBalance(landlord);
                landlordOldBalance = web3.utils.toBN(balance);
                await instance.payRent({ from: tenant, value: MONTHY_AMOUNT });
            });

            it("should send correct amount to landlord", async () => {
                let balance = await web3.eth.getBalance(landlord);
                let actual = web3.utils.toBN(balance) + '';
                let expected = landlordOldBalance.add(web3.utils.toBN(MONTHY_AMOUNT)) + '';
                expect(actual).to.equal(expected);
            });

            it("should increase payment count", async () => {
                let count = await instance.noOfMonthPaid.call();
                expect(count.toNumber()).to.equal(2); // 1 from deposit
            });

            context("on last month", async () => {

                before(async () => {
                    // loop pay for the rest
                    for (let index = 3; index <= NO_OF_MONTH; index++) {
                        await instance.payRent({ from: tenant, value: MONTHY_AMOUNT });
                    }
                });

                it("should update state", async () => {
                    let state = await instance.state.call();
                    expect(state.toNumber()).to.equal(2); // Ending
                });

                it("should not allow to pay more", async () => {
                    try {
                        await instance.payRent({ from: tenant, value: MONTHY_AMOUNT })
                        expect.fail();
                    } catch (error) {
                        expect(error).to.be.an('Error');
                    }
                });
            });
        });
    });

    describe("landlord deduct", async () => {

        context("when amount is incorrect", async () => {

            it("should revert transaction", async () => {
                try {
                    await instance.claim(MONTHY_AMOUNT * 100, { from: landlord });
                    expect.fail();
                } catch (error) {
                    expect(error).to.be.an('Error');
                }
            });
        }); 
        
        context("when amount is correct", async () => {

            let landlordOldBalance;
            before(async () => {
                let balance = await web3.eth.getBalance(landlord);
                let initialBalance = web3.utils.toBN(balance);
                let resp = await instance.claim(MONTHY_AMOUNT, { from: landlord });
                let gasUsed =  web3.utils.toBN(resp.receipt.gasUsed);
                let tx = await web3.eth.getTransaction(resp.tx);
                let gasPrice = web3.utils.toBN(tx.gasPrice);
                let ethUsed = gasPrice.mul(gasUsed);
                landlordOldBalance = initialBalance.sub(ethUsed);
            });

            it("should have correct balance", async () => {
                let balance = await web3.eth.getBalance(instance.address);
                expect(balance).to.equal(MONTHY_AMOUNT + '');
            });

            it("should update state", async () => {
                let state = await instance.state.call();
                expect(state.toNumber()).to.equal(3); // End
            });

            it("should send correct amount to landlord", async () => {
                let balance = await web3.eth.getBalance(landlord);
                let actual = web3.utils.toBN(balance) + '';
                let expected = landlordOldBalance.add(web3.utils.toBN(MONTHY_AMOUNT)) + '';
                expect(actual).to.equal(expected);
            });
        });
    });

    describe("tenant withdraw deposit", async () => {

        context("when amount is incorrect", async () => {

            it("should revert transaction", async () => {
                try {
                    await instance.withdrawDeposit({ from: tenant, value: MONTHY_AMOUNT * 4 })
                    expect.fail();
                } catch (error) {
                    expect(error).to.be.an('Error');
                }
            });
        });

        context("when amount is correct", async () => {

            let tenantOldBalance;
            before(async () => {
                let balance = await web3.eth.getBalance(tenant);
                let initialBalance = web3.utils.toBN(balance);
                let resp = await instance.withdrawDeposit({ from: tenant });
                let gasUsed =  web3.utils.toBN(resp.receipt.gasUsed);
                let tx = await web3.eth.getTransaction(resp.tx);
                let gasPrice = web3.utils.toBN(tx.gasPrice);
                let ethUsed = gasPrice.mul(gasUsed);
                tenantOldBalance = initialBalance.sub(ethUsed);
            });

            it("should send correct amount to tenant", async () => {
                let balance = await web3.eth.getBalance(tenant);
                let actual = web3.utils.toBN(balance) + '';
                let expected = tenantOldBalance.add(web3.utils.toBN(MONTHY_AMOUNT)) + '';
                expect(actual).to.equal(expected);
            });

            it("should destroy itself", async () => {
                let code = await web3.eth.getCode(instance.address);
                expect(code).to.equal('0x');
            });
        });
    });
});