# com.subnodal.subtest
## 🎛️ `DeferredPassCondition`
`class` · Condition that passes when subsequent pass condition has passed after waiting for another test to finish.

**Parameters:**
* **`subsequentPassCondition`** (`PassCondition`): Subsequent pass condition to check after other test has finished

## 🎛️ `PassCondition`
`class` · Base condition that is settled when a test passes or fails.

## 🔡️ `PassCondition.failReason`
`prop <Error | null>` · An `Error` thrown when a test has failed for further debugging purposes. Is `null` when no error is thrown.

## 🔡️ `PassCondition.passed`
`prop <Boolean | null>` · Whether the test has passed. Is `null` when a test is running or waiting.

## ⏩️ `PassCondition.run`
`method` · Start the test code. `PassCondition.passed` and/or `PassCondition.failReason` will be set appropriately in the future.

**Parameters:**
* **`testableCode`** (`Function`): Code to test

## 🎛️ `PromiseError`
`class extends (global):Error` · Error which is thrown when a promise is rejected.

**Parameters:**
* **`message`** (`String`): Human-readable message to show

## 🎛️ `PromiseRejectionEqualityPassCondition`
`class` · Condition that passes when a `Promise` is rejected with an expected value.

**Parameters:**
* **`expected`** (`*`): The expected value that should be returned

## 🎛️ `PromiseResolutionEqualityPassCondition`
`class` · Condition that passes when a `Promise` is resolved with an expected value.

**Parameters:**
* **`expected`** (`*`): The expected value that should be returned

## 🎛️ `PromiseResolutionPassCondition`
`class` · Condition that passes when a `Promise` is resolved.

## 🎛️ `RunWithoutErrorCondition`
`class` · Condition that passes when test code returns an expected value.

**Parameters:**
* **`expected`** (`*`): The expected value that should be returned

## 🎛️ `RunWithoutErrorCondition`
`class` · Condition that passes when a `Promise` is rejected.

## 🎛️ `RunWithoutErrorPassCondition`
`class` · Condition that passes when test code runs without throwing an error.

## 🎛️ `Test`
`class` · A unit or integration test that should be run.

**Parameters:**
* **`testableCode`** (`Function`): Code to test with

## ⏩️ `Test.after`
`method` · Make test only run after another test has run.

**Parameters:**
* **`mustPass`** (`Boolean` = `false`): Whether the other test must pass for this test to be run

**Returns:** `Test` · Self-return for call chaining

## 🔡️ `Test.passCondition`
`prop <PassCondition>` · Condition to check to determine if a test has passed.

## ⏩️ `Test.shouldEqual`
`method` · Set pass condition to pass if code runs and returns an expected value.

**Parameters:**
* **`expected`** (`*` = `true`): The expected value to test against

**Returns:** `Test` · Self-return for call chaining

## ⏩️ `Test.shouldReject`
`method` · Set pass condition to pass if code returns a `Promise` that rejects.

**Returns:** `Test` · Self-return for call chaining

## ⏩️ `Test.shouldRejectTo`
`method` · Set pass condition to pass if code returns a `Promise` that rejects and returns an expected value.

**Parameters:**
* **`expected`** (`*` = `true`): The expected value to test against

**Returns:** `Test` · Self-return for call chaining

## ⏩️ `Test.shouldResolve`
`method` · Set pass condition to pass if code returns a `Promise` that resolves.

**Returns:** `Test` · Self-return for call chaining

## ⏩️ `Test.shouldResolveTo`
`method` · Set pass condition to pass if code returns a `Promise` that resolves and returns an expected value.

**Parameters:**
* **`expected`** (`*` = `true`): The expected value to test against

**Returns:** `Test` · Self-return for call chaining

## ⏩️ `Test.shouldRun`
`method` · Set pass condition to pass if code runs without throwing an error.

**Returns:** `Test` · Self-return for call chaining

## ⏩️ `Test.shouldThrow`
`method` · Set pass condition to pass if code throws an error.

**Parameters:**
* **`expected`** (`Error | null`): The expected `Error` to be thrown, or `null` if any `Error` can be thrown

**Returns:** `Test` · Self-return for call chaining

## 🔡️ `Test.testableCode`
`prop <Function>`

## 🎛️ `TestError`
`class extends (global):Error` · Error which is thrown when a test fails.

**Parameters:**
* **`message`** (`String`): Human-readable message to show

## 🎛️ `ThrowPassCondition`
`class` · Condition that passes when test code throws an `Error`.

**Parameters:**
* **`expected`** (`Error | null`): The expected `Error` to be thrown, or `null` if any `Error` can be thrown

## ▶️ `registerUpdateCallback`
`function` · Listen to any test updates, such as when a test pass condition settles from running to pass. Is always run when at least one test is running, even when no test pass conditions have changed.

**Parameters:**
* **`callback`** (`Function`): Callback unction to run when test updates are emitted

## ▶️ `runTests`
`function` · Run all tests specified in `tests` parameter and return a `Promise` that resolves when all tests have passed, or rejects when at least one test fails.

**Parameters:**
* **`tests`** (`{Test}`): Object containing tests. Keys will be used as test name

**Returns:** `Promise` · `Promise` to resolve or reject depending on test status

## ▶️ `runTestsOnWeb`
`function` · Run all tests specified in `tests` parameter and return a `Promise` that resolves when all tests have passed, or rejects when at least one test fails. A web console will be added to the DOM to display the all test statuses.

**Parameters:**
* **`tests`** (`{Test}`): Object containing tests. Keys will be used as test name

**Returns:** `Promise` · `Promise` to resolve or reject depending on test status