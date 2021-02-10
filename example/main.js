function sayHello() {
    console.log("Hello, world!");
}

function helloUser(name) {
    return "Hello, " + name + "!";
}

function helloIn5Seconds() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve("Hello, world!");
        }, 5000);
    });
}

function throwError() {
    throw new Error("Oops!");
}