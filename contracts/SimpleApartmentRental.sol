// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import "./Rental.sol";

/**
Simple apartment rental contract where
- tenant has to put the deposit 3 times of amount to activate the contract (2 deposit + 1 advance).
- landlord can claim deposit after contract completed.
- after landlord claimed deposit, tenant can take the remaining of deposit.
 */
contract SimpleApartmentRental is Rental {

    uint256 immutable public noOfMonth;
    uint256 immutable public monthlyAmount;
    address immutable public landlord;
    address payable immutable public tenant;

    uint256 public noOfMonthPaid;
    State public state;

    enum State { Created, Active, Ending, Ended }

    modifier onlyTenant {
        require(msg.sender == tenant);
        _;
    }

    modifier onlyLandlord {
        require(msg.sender == landlord);
        _;
    }

    modifier onlyState(State _state) {
        require(state == _state);
        _;
    }

    /**
    Create contact and caller will be landlord
    @param _tenant address of tenant
    @param _noOfMonth number of month for this rental contract
    @param _monthlyAmount amount that tenant has to pay each month 
     */
    constructor(address payable _tenant, uint256 _noOfMonth, uint256 _monthlyAmount) {
        landlord = msg.sender;
        tenant = _tenant;
        noOfMonth = _noOfMonth;
        monthlyAmount = _monthlyAmount;
    }

    /**
    Tenant to deposit the money 3 times of monthly amount.
    One will be forwarded to landlord and other two will stay in contract.

    If transaction is success that contract will be in active.
     */
    function deposit()
        external 
        override 
        payable
        onlyTenant()
        onlyState(State.Created)
    {
        // tenant has to deposit 3 times of amount to activate the contract
        require(msg.value == monthlyAmount * 3);

        // set contract state to Active
        state = State.Active;
        noOfMonthPaid = 1;

        // send monthly amount to landlord
        (bool success, ) = landlord.call{value: monthlyAmount}("");
        require(success, "Transfer failed.");
    }

    /**
    Each month tenant makes this transaction to pay rent to landlord. 
    The amount will be forwarded to landlord.

    When number of times payment made is equal to `noOfMonth`, contract will stop receving money
    and will be waiting landlord to make a final claim if any.
     */
    function payRent()
        external
        override
        payable
        onlyTenant()
        onlyState(State.Active)
    {
        // value must equal the defined monthly amount
        require(msg.value == monthlyAmount);

        // increase paid month count
        noOfMonthPaid += 1;
        if (noOfMonthPaid == noOfMonth) {
            state = State.Ending;
        }

        // forward to landlord
        (bool success, ) = landlord.call{value: msg.value}("");
        require(success, "Transfer failed.");
    }

    /**
    Landlord claim the money if need after tenant paid all the amount.
    Send zero if no claims.
    @param amount The amount landlord wants to claim.
     */
    function claim(uint256 amount)
        external
        override
        onlyLandlord()
        onlyState(State.Ending)
    {
        // request amount must less than current contract balance
        require(amount <= address(this).balance);

        // update contract state
        state = State.Ended;

        // transfer to landlord
        if (amount > 0) {
            (bool success, ) = landlord.call{value: amount}("");
            require(success, "Transfer failed.");
        }
    }

    /**
    Tenant withdraws the remaining deposit.
     */
    function withdrawDeposit()
        external
        override
        onlyTenant()
        onlyState(State.Ended)
    {
        selfdestruct(tenant);
    }
}