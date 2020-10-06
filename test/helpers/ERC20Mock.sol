pragma solidity ^0.6.0;

interface ERC20Mock {
    function name() external view returns (string memory name);
    function symbol() external view returns (string memory symbol);
    function decimals() external view returns (uint8 decimals);
    function totalSupply() external view returns (uint256 totalSupply);
    function balanceOf(address _owner) external view returns (uint256 balance);
    function transfer(address _to, uint256 _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    function approve(address _spender, uint256 _value) external returns (bool success);
    function allowance(address _owner, address _spender) external returns (uint256 remaining);
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}
