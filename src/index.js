const args = process.argv.slice(2);
const os = require('os');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

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

// Listen for the .exit command and other user inputs
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function calculateFileHash(filePath) {
    const hash = crypto.createHash('sha256');
    const fileData = fs.readFileSync(filePath);
    hash.update(fileData);
    return hash.digest('hex');
}

function handleCommand(command) {
    let result;
    let mistake = 'Invalid input';

    if (command.startsWith('cd')) {
        try {
            const targetDirectory = command.slice(2).trim();
            process.chdir(path.resolve(process.cwd(), targetDirectory));
            result = true;
        } catch (error) {
            result = false;
        }
    } else if (command === 'ls') {
        try {
            const currentDirectory = process.cwd();
            const contents = fs.readdirSync(currentDirectory);
            const folders = contents.filter((item) =>
                fs.statSync(path.join(currentDirectory, item)).isDirectory()
            );
            const files = contents.filter((item) => !folders.includes(item));
            folders.sort();
            files.sort();

            console.log('Type\t\tName');
            folders.forEach((folder) => console.log('Folder\t\t', folder));
            files.forEach((file) => console.log('File\t\t', file));

            result = true;
        } catch (error) {
            result = false;
        }
    } else if (command === 'up') {
        try {
            const parentDirectory = path.dirname(process.cwd());
            if (parentDirectory !== process.cwd()) {
                process.chdir('..');
            }
            // Set result to true regardless of whether the directory changed or not
            result = true;
        } catch (error) {
            result = false;
        }
    } else if (command.startsWith('cat')) {
        const filePath = command.slice(3).trim(); // Extract the file path

        // Create a Readable stream and pipe it to process.stdout
        const fileStream = fs.createReadStream(filePath);
        result = true;

        // fileStream.on('error', (error) => {
        //     result = false;
        // });

        fileStream.pipe(process.stdout);

        // Listen for the 'end' event to indicate completion
        fileStream.on('end', () => {
            console.log('\n'); // Add a newline after printing file contents
        });
    } else if (command.startsWith('add')) {
        try {
            const match = command.match(/^add\s+(.+)$/);
            if (match) {
                const fileName = match[1].trim();
                if (fileName) {
                    const filePath = path.join(process.cwd(), fileName);
                    fs.writeFileSync(filePath, '');
                    result = true;
                } else {
                    result = false;
                }
            } else {
                result = false;
            }
        } catch (error) {
            result = false;
        }
    } else if (command.startsWith('rn')) {
        const match = command.match(/^rn\s+(.+)\s+(.+)$/);
        if (match) {
            const oldFilePath = match[1].trim();
            const newFileName = match[2].trim();

            if (oldFilePath && newFileName) {
                const oldPath = path.join(process.cwd(), oldFilePath);
                const newPath = path.join(process.cwd(), newFileName);

                fs.renameSync(oldPath, newPath);
                result = true;
            } else {
                result = false;
            }
        } else {
            result = false;
        }
    } else if (command.startsWith('cp')) {
        try {
            const match = command.match(/^cp\s+(.+)\s+(.+)$/);
            if (match) {
                const sourceFilePath = match[1].trim();
                const destinationDirectory = match[2].trim();

                if (sourceFilePath && destinationDirectory) {
                    const sourcePath = path.join(process.cwd(), sourceFilePath);
                    const destinationPath = path.join(
                        process.cwd(),
                        destinationDirectory,
                        path.basename(sourceFilePath)
                    );

                    fs.copyFileSync(sourcePath, destinationPath);
                    result = true;
                } else {
                    result = false;
                }
            } else {
                result = false;
            }
        } catch (error) {
            result = false;
        }
    } else if (command.startsWith('mv')) {
        const match = command.match(/^mv\s+(.+)\s+(.+)$/);
        if (match) {
            const sourceFilePath = match[1].trim();
            const destinationDirectory = match[2].trim();

            if (sourceFilePath && destinationDirectory) {
                const sourcePath = path.join(process.cwd(), sourceFilePath);
                const destinationPath = path.join(
                    process.cwd(),
                    destinationDirectory,
                    path.basename(sourceFilePath)
                );

                fs.renameSync(sourcePath, destinationPath);
                result = true;
            } else {
                result = false;
            }
        } else {
            result = false;
        }
    } else if (command.startsWith('rm')) {
        const filePath = command.slice(2).trim(); // Extract the file path
        if (filePath) {
            const fullPath = path.join(process.cwd(), filePath);
            fs.unlinkSync(fullPath);
            result = true;
        } else {
            console.log(
                'Please provide a valid file path for the "rm" command.'
            );
            result = false;
        }
    } else if (command === 'os --EOL') {
        // Get and print the default system End-Of-Line (EOL)
        console.log(JSON.stringify(os.EOL));
        result = true;
    } else if (command.trim() === 'os --cpus') {
        // Get and print host machine's CPU info
        const cpus = os.cpus();

        console.log(`Overall CPUs: ${cpus.length}`);

        cpus.forEach((cpu, index) => {
            console.log(`CPU ${index + 1}:`);
            console.log(`  Model: ${cpu.model}`);
            console.log(`  Clock Rate: ${cpu.speed / 1000} GHz`);
            console.log('----------------------');
        });
    } else if (command.trim() === 'os --homedir') {
        // Get and print the home directory
        const homeDir = os.homedir();
        console.log(`Home Directory: ${homeDir}`);
        result = true;
    } else if (command.trim() === 'os --username') {
        // Get and print the current user's username
        const username = process.env.USERNAME || process.env.USER || 'Unknown';
        console.log(`Current User's Username: ${username}`);
        result = true;
    } else if (command.trim() === 'os --architecture') {
        // Get and print the CPU architecture
        const cpuArchitecture = os.arch();
        console.log(`CPU Architecture: ${cpuArchitecture}`);
        result = true;
    } else if (command.startsWith('hash')) {
        const filePath = command.slice(4).trim(); // Extract the file path

        // Check if the file exists
        if (fs.existsSync(filePath)) {
            const fileContents = fs.readFileSync(filePath);
            const hash = crypto
                .createHash('sha256')
                .update(fileContents)
                .digest('hex');
            console.log(`Hash for file "${filePath}": ${hash}`);
            result = true;
        } else {
            result = false;
        }
    } else if (command.startsWith('compress')) {
        try {
            const filePathAndDestination = command.slice(8).trim();
            const [filePath, destinationPath] =
                filePathAndDestination.split(/\s+/);

            const absolutePath = path.resolve(process.cwd(), filePath);

            // Check if the file exists
            if (fs.existsSync(absolutePath)) {
                const compressedFilePath = path.resolve(
                    process.cwd(),
                    destinationPath,
                    path.basename(filePath) + '.br'
                );

                const readStream = fs.createReadStream(absolutePath);
                const writeStream = fs.createWriteStream(compressedFilePath);

                const brotliStream = zlib.createBrotliCompress();

                // Pipe the read stream through the Brotli compression stream to the write stream
                readStream.pipe(brotliStream).pipe(writeStream);

                writeStream.on('finish', () => {
                    console.log(
                        `File "${absolutePath}" compressed to "${compressedFilePath}" successfully.`
                    );
                    // Additional operations or checks can be added here

                    result = true;
                });
            } else {
                console.log(`File "${absolutePath}" not found.`);
                result = false;
            }
        } catch (error) {
            console.error(error);
            result = false;
        }
    } else if (command.startsWith('decompress')) {
        try {
            const filePath = command.slice(10).trim();
            const destinationPath =
                args[args.indexOf('path_to_destination') + 1] || '.'; // Default to current directory if not provided

            const readStream = fs.createReadStream(filePath);
            const writeStream = fs.createWriteStream(
                path.join(process.cwd(), destinationPath)
            );
            const brotliStream = zlib.createBrotliDecompress();

            // Pipe the read stream through the Brotli decompression stream to the write stream
            readStream.pipe(brotliStream).pipe(writeStream);

            writeStream.on('finish', () => {
                console.log(
                    `File "${filePath}" decompressed to "${destinationPath}" successfully.`
                );
                result = true;
            });
        } catch (error) {
            console.error('Error during decompression:', error.message);
            result = false;
        }
    } else {
        result = false;
    }

    if (result === true) {
        return result;
    } else {
        console.log(mistake);
        return result;
    }
}

rl.on('line', (input) => {
    if (input.trim() === '.exit') {
        console.log(`Thank you for using File Manager, ${username}, goodbye!`);
        rl.close();
        process.exit();
    } else {
        const result = handleCommand(input.trim());
        // Print the current working directory after each operation
        console.log(`You are currently in ${process.cwd()}`);
    }
});

// Handle SIGINT manually (Ctrl+C)
rl.on('SIGINT', () => {
    console.log(`Thank you for using File Manager, ${username}, goodbye!`);
    rl.close();
    process.exit();
});
