// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

/**
Interface of rental agreement
 */
interface Rental {

    /**
    Called by tenant to deposit the money and make contract in effect.
     */
    function deposit() external payable;

    /**
    Called by tenant to pay the rent
     */
    function payRent() external payable;

    /**
    Called by landlord to claim and deduct the tenant's deposit.
     */
    function claim(uint256 amount) external;

    /**
    Called by tenant after this contract ends to get back the deposit.
     */
    function withdrawDeposit() external;
}