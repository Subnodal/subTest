/*
    subTest

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

// @namespace com.subnodal.subtest
namespace("com.subnodal.subtest", function(exports) {
    var updateCallbacks = [];
    var consoleElement = null;

    /*
        @name TestError
        @type class extends (global):Error
        Error which is thrown when a test fails.
        @param message <String> Human-readable message to show
    */
    exports.TestError = class extends Error {
        constructor(message) {
            super(message);

            this.name = "TestError";
        }
    };

    /*
        @name PromiseError
        @type class extends (global):Error
        Error which is thrown when a promise is rejected.
        @param message <String> Human-readable message to show
    */
    exports.PromiseError = class extends Error {
        constructor(message) {
            super(message);

            this.name = "PromiseError";
        }
    };

    /*
        @name PassCondition
        @type class
        Base condition that is settled when a test passes or fails.
    */
    /*
        @name PassCondition.passed
        @type prop <Boolean | null>
        Whether the test has passed. Is `null` when a test is running or
        waiting.
    */
    /*
        @name PassCondition.failReason
        @type prop <Error | null>
        An `Error` thrown when a test has failed for further debugging purposes.
        Is `null` when no error is thrown.
   */
    exports.PassCondition = class {
        constructor() {
            this.passed = null;
            this.failReason = null;
        }

        /*
            @name PassCondition.run
            @type method
            Start the test code. `PassCondition.passed` and/or
            `PassCondition.failReason` will be set appropriately in the future.
            @param testableCode <Function> Code to test
        */
        run(testableCode) {
            throw new Error("Test pass condition has not been overridden");
        }
    };

    /*
        @name RunWithoutErrorPassCondition
        @type class
        Condition that passes when test code runs without throwing an error.
    */
    exports.RunWithoutErrorPassCondition = class extends exports.PassCondition {
        run(testableCode) {
            try {
                testableCode();

                this.passed = true;
            } catch (e) {
                this.passed = false;
                this.failReason = e;
            }
        }
    };

    /*
        @name RunWithoutErrorCondition
        @type class
        Condition that passes when test code returns an expected value.
        @param expected <*> The expected value that should be returned
    */
    exports.EqualityPassCondition = class extends exports.PassCondition {
        constructor(expected) {
            super();

            this.expected = expected;
        }

        run(testableCode) {
            try {
                this.passed = testableCode() == this.expected;
                this.failReason = testableCode() != this.expected ? new exports.TestError("Unmet equality") : null;
            } catch (e) {
                this.passed = false;
                this.failReason = e;
            }
        }
    };

    /*
        @name PromiseResolutionPassCondition
        @type class
        Condition that passes when a `Promise` is resolved.
    */
    exports.PromiseResolutionPassCondition = class extends exports.PassCondition {
        run(testableCode) {
            var thisScope = this;

            try {
                testableCode().then(() => this.passed = true).catch(function(error) {
                    thisScope.passed = false;
                    thisScope.failReason = new exports.PromiseError(error);
                });
            } catch (e) {
                this.passed = false;
                this.failReason = e;
            }
        }
    };

    /*
        @name PromiseResolutionEqualityPassCondition
        @type class
        Condition that passes when a `Promise` is resolved with an expected
        value.
        @param expected <*> The expected value that should be returned
    */
    exports.PromiseResolutionEqualityPassCondition = class extends exports.EqualityPassCondition {
        run(testableCode) {
            var thisScope = this;

            try {
                testableCode().then(function(i) {
                    thisScope.passed = i == thisScope.expected;
                    thisScope.failReason = i != thisScope.expected ? new exports.TestError("Unmet equality") : null;
                }).catch(function(error) {
                    thisScope.passed = false;
                    thisScope.failReason = new exports.PromiseError(error);
                });
            } catch (e) {
                this.passed = false;
                this.failReason = e;
            }
        }
    };

    /*
        @name RunWithoutErrorCondition
        @type class
        Condition that passes when a `Promise` is rejected.
    */
    exports.PromiseRejectionPassCondition = class extends exports.PassCondition {
        run(testableCode) {
            var thisScope = this;

            try {
                testableCode().then(function() {
                    thisScope.passed = false;
                    thisScope.failReason = new exports.TestError("No promise rejection was made");
                }).catch(() => this.passed = true);
            } catch (e) {
                this.passed = false;
                this.failReason = e;
            }
        }
    };

    /*
        @name PromiseRejectionEqualityPassCondition
        @type class
        Condition that passes when a `Promise` is rejected with an expected
        value.
        @param expected <*> The expected value that should be returned
    */
    exports.PromiseRejectionEqualityPassCondition = class extends exports.EqualityPassCondition {
        run(testableCode) {
            var thisScope = this;

            try {
                testableCode().then(function() {
                    thisScope.passed = false;
                    thisScope.failReason = new exports.TestError("No promise rejection was made");
                }).catch(function() {
                    thisScope.passed = i == thisScope.expected;
                    thisScope.failReason = i != thisScope.expected ? new exports.TestError("Unmet equality") : null;
                });
            } catch (e) {
                this.passed = false;
                this.failReason = e;
            }
        }
    };

    /*
        @name ThrowPassCondition
        @type class
        Condition that passes when test code throws an `Error`.
        @param expected <Error | null> The expected `Error` to be thrown, or `null` if any `Error` can be thrown
    */
    exports.ThrowPassCondition = class extends exports.EqualityPassCondition {
        run(testableCode) {
            try {
                testableCode();

                this.passed = false;
                this.failReason = new exports.TestError("Code ran without throwing an error");
            } catch (e) {
                if (this.expected == null) {
                    this.passed = true;

                    return;
                }

                this.passed = e.name == this.expected.name && e.message == this.expected.message;

                if (!this.passed) {
                    this.failReason = e;
                }
            }
        }
    };

    /*
        @name DeferredPassCondition
        @type class
        Condition that passes when subsequent pass condition has passed after
        waiting for another test to finish.
        @param subsequentPassCondition <PassCondition> Subsequent pass condition to check after other test has finished
    */
    exports.DeferredPassCondition = class extends exports.PassCondition {
        constructor(subsequentPassCondition) {
            super();

            this.subsequentPassCondition = subsequentPassCondition;

            this.waiting = true;
        }

        run(testableCode) {
            var thisScope = this;

            testableCode().then(function(i) {
                thisScope.waiting = false;

                thisScope.subsequentPassCondition.run(i);

                var conditionCheckInterval = setInterval(function() {
                    thisScope.passed = thisScope.subsequentPassCondition.passed;
                    thisScope.failReason = thisScope.subsequentPassCondition.failReason;

                    if (thisScope.passed != null) {
                        clearInterval(conditionCheckInterval);
                    }
                });
            }).catch(function(error) {
                thisScope.passed = false;
                thisScope.failReason = new exports.TestError(error);
            });
        }
    };

    /*
        @name Test
        @type class
        A unit or integration test that should be run.
        @param testableCode <Function> Code to test with
    */
    /*
        @name Test.testableCode
        @type prop <Function>
    */
    /*
        @name Test.passCondition
        @type prop <PassCondition>
        Condition to check to determine if a test has passed.
    */
    exports.Test = class {
        constructor(testableCode) {
            this.testableCode = testableCode;

            this.passCondition = new exports.RunWithoutErrorPassCondition();
        }

        /*
            @name Test.shouldRun
            @type method
            Set pass condition to pass if code runs without throwing an error.
            @returns <Test> Self-return for call chaining
        */
        shouldRun() {
            this.passCondition = new exports.RunWithoutErrorPassCondition();

            return this;
        }

        /*
            @name Test.shouldEqual
            @type method
            Set pass condition to pass if code runs and returns an expected
            value.
            @param expected <* = true> The expected value to test against
            @returns <Test> Self-return for call chaining
        */
        shouldEqual(expected = true) {
            this.passCondition = new exports.EqualityPassCondition(expected);

            return this;
        }

        /*
            @name Test.shouldResolve
            @type method
            Set pass condition to pass if code returns a `Promise` that
            resolves.
            @returns <Test> Self-return for call chaining
        */
        shouldResolve() {
            this.passCondition = new exports.PromiseResolutionPassCondition();

            return this;
        }

        /*
            @name Test.shouldResolveTo
            @type method
            Set pass condition to pass if code returns a `Promise` that resolves
            and returns an expected value.
            @param expected <* = true> The expected value to test against
            @returns <Test> Self-return for call chaining
        */
        shouldResolveTo(expected = true) {
            this.passCondition = new exports.PromiseResolutionEqualityPassCondition(expected);

            return this;
        }

        /*
            @name Test.shouldReject
            @type method
            Set pass condition to pass if code returns a `Promise` that
            rejects.
            @returns <Test> Self-return for call chaining
        */
        shouldReject() {
            this.passCondition = new exports.PromiseRejectionPassCondition();

            return this;
        }

        /*
            @name Test.shouldRejectTo
            @type method
            Set pass condition to pass if code returns a `Promise` that rejects
            and returns an expected value.
            @param expected <* = true> The expected value to test against
            @returns <Test> Self-return for call chaining
        */
        shouldRejectTo(expected = true) {
            this.passCondition = new exports.PromiseRejectionEqualityPassCondition(expected);

            return this;
        }

        /*
            @name Test.shouldThrow
            @type method
            Set pass condition to pass if code throws an error.
            @param expected <Error | null> The expected `Error` to be thrown, or `null` if any `Error` can be thrown
            @returns <Test> Self-return for call chaining
        */
        shouldThrow(expected = null) {
            this.passCondition = new exports.ThrowPassCondition(expected);

            return this;
        }

        /*
            @name Test.after
            @type method
            Make test only run after another test has run.
            @param mustPass <Boolean = false> Whether the other test must pass for this test to be run
            @returns <Test> Self-return for call chaining
        */
        after(test, mustPass = false) {
            var oldTestableCode = this.testableCode.bind({});

            var newTestableCode = function() {
                return new Promise(function(resolve, reject) {
                    var testCheckInverval = setInterval(function() {
                        if (test.passCondition.passed != null) {
                            clearInterval(testCheckInverval);

                            if (test.passCondition.passed == true || !mustPass) {
                                resolve(oldTestableCode);
                            } else {
                                reject("Test is dependent on another test's success");
                            }
                        }
                    });
                });
            };

            this.testableCode = newTestableCode;
            this.passCondition = new exports.DeferredPassCondition(this.passCondition);

            return this;
        }
    };

    /*
        @name registerUpdateCallback
        Listen to any test updates, such as when a test pass condition settles
        from running to pass. Is always run when at least one test is running,
        even when no test pass conditions have changed.
        @param callback <Function> Callback function to run when test updates are emitted
    */
    exports.registerUpdateCallback = function(callback) {
        updateCallbacks.push(callback);
    };

    /*
        @name runTests
        Run all tests specified in `tests` parameter and return a `Promise` that
        resolves when all tests have passed, or rejects when at least one test
        fails.
        @param tests <{Test}> Object containing tests. Keys will be used as test name
        @returns <Promise> `Promise` to resolve or reject depending on test status
    */
    exports.runTests = function(tests) {
        for (var test in tests) {
            tests[test].passCondition.run(tests[test].testableCode);
        }

        return new Promise(function(resolve, reject) {
            var testCheckInterval = setInterval(function() {
                var anyNulls = false;
                var anyFails = false;
    
                for (var test in tests) {
                    if (tests[test].passCondition.passed == null) {
                        anyNulls = true;
                    }
    
                    if (tests[test].passCondition.passed == false) {
                        anyFails = true;
                    }
                }

                updateCallbacks.forEach((i) => i(tests));

                if (!anyNulls) {
                    if (!anyFails) {
                        resolve(tests);
                    } else {
                        reject(tests);
                    }

                    clearTimeout(testCheckInterval);
                }
            });
        });
    };

    function clearWebConsole() {
        consoleElement.innerHTML = "";
    };

    function addToWebConsole(message, type = "info") {
        var entryElement = document.createElement("div");

        for (var property in entryElement.style) {
            entryElement.style[property] = "inherit";
        }

        switch (type) {
            case "pass":
                entryElement.style.color = "green";
                break;
            case "fail":
                entryElement.style.color = "red";
                break;
            case "running":
                entryElement.style.color = "blue";
                break;
            default:
                entryElement.style.color = "white";
                break;
        }

        entryElement.innerText = message;

        consoleElement.appendChild(entryElement);
    }

    /*
        @name runTestsOnWeb
        Run all tests specified in `tests` parameter and return a `Promise` that
        resolves when all tests have passed, or rejects when at least one test
        fails. A web console will be added to the DOM to display the all test
        statuses.
        @param tests <{Test}> Object containing tests. Keys will be used as test name
        @returns <Promise> `Promise` to resolve or reject depending on test status
    */
    exports.runTestsOnWeb = function(tests) {
        consoleElement = document.createElement("pre");

        for (var property in consoleElement.style) {
            consoleElement.style[property] = "initial";
        }

        Object.assign(consoleElement.style, {
            "position": "fixed",
            "bottom": "0",
            "left": "0",
            "width": "100%",
            "height": "20vh",
            "margin": "0",
            "padding": "0.5em",
            "box-sizing": "border-box",
            "background-color": "black",
            "color": "white",
            "font-size": "1em",
            "font-family": "\"Overpass Mono\", monospace",
            "overflow": "auto",
            "z-index": String(Math.pow(2, 31) - 1) // Highest z-index value
        });

        exports.registerUpdateCallback(function(tests) {
            clearWebConsole();

            var passedTests = 0;
            var failedTests = 0;
            var runningTests = 0;

            for (var test in tests) {
                switch (tests[test].passCondition.passed) {
                    case true:
                        passedTests++;
                        break;

                    case false:
                        failedTests++;
                        break;

                    default:
                        runningTests++;
                        break;
                }
            }

            addToWebConsole(
                `Tests passed: ${passedTests} of ${passedTests + failedTests + runningTests} (${failedTests} failed, ${runningTests} running) ` +
                `${Math.round((passedTests / (passedTests + failedTests + runningTests)) * 100)}%`,
            "info");

            for (var test in tests) {
                var entryType = "running";
                var entryMessagePrefix = "⏳ WAIT: ";

                if (tests[test].passCondition.passed == true) {
                    entryType = "pass";
                    entryMessagePrefix = "✅ PASS: ";
                } else if (tests[test].passCondition.passed == false) {
                    entryType = "fail";
                    entryMessagePrefix = "❌ FAIL: ";
                } else if (tests[test].passCondition instanceof exports.DeferredPassCondition && tests[test].passCondition.waiting) {
                    entryType = "running";
                    entryMessagePrefix = "⏳ WAIT (deferred): ";
                }

                if (tests[test].passCondition.passed != false) {
                    addToWebConsole(entryMessagePrefix + test, entryType);
                } else {
                    addToWebConsole(entryMessagePrefix + test + ` (${tests[test].passCondition.failReason == null ? "Unknown error" : tests[test].passCondition.failReason.toString()})`, entryType);
                }
            }
        });

        document.body.appendChild(consoleElement);

        return exports.runTests(tests);
    };
});
// @endnamespace