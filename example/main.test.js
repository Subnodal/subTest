var subTest = require("com.subnodal.subtest");

var sayHelloTest = new subTest.Test(sayHello).shouldRun();
var sayHelloToUserTest = new subTest.Test(() => helloUser("Subnodal")).shouldEqual("Hello, Subnodal!");
var resolveIn5SecondsTest = new subTest.Test(helloIn5Seconds).shouldResolve();
var sayHelloIn5SecondsTest = new subTest.Test(helloIn5Seconds).shouldResolveTo("Hello, world!");
var throwErrorTest = new subTest.Test(throwError).shouldThrow();
var throwErrorSpecificTest = new subTest.Test(throwError).shouldThrow(new Error("Oops!"));
var helloAgainTest = new subTest.Test(sayHello).shouldRun().after(sayHelloIn5SecondsTest, true);

window.onload = function() {
    subTest.runTestsOnWeb({
        sayHelloTest,
        sayHelloToUserTest,
        resolveIn5SecondsTest,
        sayHelloIn5SecondsTest,
        throwErrorTest,
        throwErrorSpecificTest,
        helloAgainTest
    }).then(function() {
        console.log("All tests passed!");
    }).catch(function() {
        console.log("Uh oh... Something failed!");
    });
};