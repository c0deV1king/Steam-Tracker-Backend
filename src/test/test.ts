import { expect } from "chai";

// Describe the test suite
describe("Array", function () {
  // Specify a test case
  it("should start empty", function () {
    // Create a new array
    const arr = [];

    // Assertion: the array should have a length of 0
    expect(arr).to.have.lengthOf(0);
  });
});
