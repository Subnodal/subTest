/*
    subTest

    Copyright (C) Subnodal Technologies. All Rights Reserved.

    https://subnodal.com
    Licenced by the Subnodal Open-Source Licence, which can be found at LICENCE.md.
*/

namespace("com.subnodal.subtest", function(exports) {
    var updateCallbacks = [];
    var consoleElement = null;

    exports.PassCondition = class {
        constructor() {
            this.passed = null;
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
            } catch (e) {
                this.passed = false;
            }
        }
    };

    exports.PromiseResolutionPassCondition = class extends exports.PassCondition {
        run(testableCode) {
            try {
                testableCode().then(() => this.passed = true).catch(() => this.passed = false);
            } catch (e) {
                this.passed = false;
            }
        }
    };

    exports.PromiseResolutionEqualityPassCondition = class extends exports.EqualityPassCondition {
        run(testableCode) {
            try {
                testableCode().then((i) => this.passed = i == this.expected).catch(() => this.passed = false);
            } catch (e) {
                this.passed = false;
            }
        }
    };

    exports.PromiseRejectionPassCondition = class extends exports.PassCondition {
        run(testableCode) {
            try {
                testableCode().then(() => this.passed = true).catch(() => this.passed = false);
            } catch (e) {
                this.passed = false;
            }
        }
    };

    exports.PromiseRejectionEqualityPassCondition = class extends exports.EqualityPassCondition {
        run(testableCode) {
            try {
                testableCode().then(() => this.passed = false).catch((i) => this.passed = i == this.expected);
            } catch (e) {
                this.passed = false;
            }
        }
    };

    exports.ThrowPassCondition = class extends exports.EqualityPassCondition {
        run(testableCode) {
            try {
                testableCode();

                this.passed = false;
            } catch (e) {
                if (this.expected == null) {
                    this.passed = true;

                    return;
                }

                this.passed = e.name == this.expected.name && e.message == this.expected.message;
            }
        }
    };

    exports.Test = class {
        constructor(testableCode) {
            this.testableCode = testableCode;
            this.passCondition = null;
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

            for (var test in tests) {
                var entryType = "running";
                var entryMessagePrefix = "⏳ WAIT: ";

                if (tests[test].passCondition.passed == true) {
                    entryType = "pass";
                    entryMessagePrefix = "✅ PASS: ";
                } else if (tests[test].passCondition.passed == false) {
                    entryType = "fail";
                    entryMessagePrefix = "❌ FAIL: ";
                }

                addToWebConsole(entryMessagePrefix + test, entryType);
            }
        });

        document.body.appendChild(consoleElement);

        return exports.runTests(tests);
    };
});