/*
    subTest

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

namespace("com.subnodal.subtest", function(exports) {
    var updateCallbacks = [];
    var consoleElement = null;

    exports.TestError = class extends Error {
        constructor(message) {
            super(message);

            this.name = "TestError";
        }
    };

    exports.PromiseError = class extends Error {
        constructor(message) {
            super(message);

            this.name = "PromiseError";
        }
    };

    exports.PassCondition = class {
        constructor() {
            this.passed = null;
            this.failReason = null;
        }

        run(testableCode) {
            throw new Error("Test pass condition has not been overridden");
        }
    };

    exports.RunWithoutErrorCondition = class extends exports.PassCondition {
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

    exports.Test = class {
        constructor(testableCode) {
            this.testableCode = testableCode;
            this.passCondition = new exports.RunWithoutErrorCondition();
        }

        shouldRun() {
            this.passCondition = new exports.RunWithoutErrorCondition();

            return this;
        }

        shouldEqual(expected = true) {
            this.passCondition = new exports.EqualityPassCondition(expected);

            return this;
        }

        shouldResolve() {
            this.passCondition = new exports.PromiseResolutionPassCondition();

            return this;
        }

        shouldResolveTo(expected = true) {
            this.passCondition = new exports.PromiseResolutionEqualityPassCondition(expected);

            return this;
        }

        shouldReject() {
            this.passCondition = new exports.PromiseResolutionPassCondition();

            return this;
        }

        shouldRejectTo(expected = true) {
            this.passCondition = new exports.PromiseResolutionEqualityPassCondition(expected);

            return this;
        }

        shouldThrow(expected = null) {
            this.passCondition = new exports.ThrowPassCondition(expected);

            return this;
        }

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

    exports.registerUpdateCallback = function(callback) {
        updateCallbacks.push(callback);
    };

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
    
                if (anyFails) {
                    reject(tests);
                }
                
                if (!anyNulls) {
                    if (!anyFails) {
                        resolve(tests);
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