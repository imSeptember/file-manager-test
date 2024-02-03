const args = process.argv.slice(2);
const os = require('os');

let usernameArgIndex = args.indexOf('--username');
let username =
    args[usernameArgIndex + 1].split('=')[1] || args[usernameArgIndex + 1];

// Set the initial working directory to the user's home directory
process.chdir(os.homedir());

// Function to print the welcome message and current working directory
function printWelcomeMessage() {
    console.log(`Welcome to the File Manager, ${username}!\n`);
    console.log(`You are currently in ${process.cwd()}`);
}

printWelcomeMessage(); // Print at the beginning

// Listen for the .exit command
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.on('line', (input) => {
    if (input.trim() === '.exit') {
        console.log(`Thank you for using File Manager, ${username}, goodbye!`);
        rl.close();
        process.exit();
    } else {
        // Your other operations here
        const result = handleCommand(input.trim());
        if (!result) {
            console.log('Invalid input');
            console.log(`You are currently in ${process.cwd()}`);
        }
    }
});

function handleCommand(command) {
    let result;

    switch (command) {
        case 'ls':
            try {
                // Your logic for "ls" operation here
                // For example: fs.readdirSync(process.cwd()).forEach(file => console.log(file));
                result = true;
            } catch (error) {
                console.log('Invalid input', error.message);
                result = false;
            }
            break;
        case 'cd':
            console.log('Changing directory...');
            try {
                // Your logic for "cd" operation here
                // For example: process.chdir(newPath);
                result = true;
            } catch (error) {
                console.log('Invalid input', error.message);
                result = false;
            }
            break;
        // Add more cases for other commands as needed
        default:
            result = false;
    }

    // Print the current working directory after each operation
    console.log(`You are currently in ${process.cwd()}`);

    return result;
}

// Handle SIGINT manually (Ctrl+C)
rl.on('SIGINT', () => {
    console.log(`Thank you for using File Manager, ${username}, goodbye!`);
    rl.close();
    process.exit();
});
