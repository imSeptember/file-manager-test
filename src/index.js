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

    if (command.startsWith('cd')) {
        try {
            const targetDirectory = command.slice(2).trim();
            process.chdir(path.resolve(process.cwd(), targetDirectory));
            result = true;
        } catch (error) {
            console.log('Error changing directory', error.message);
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
            console.log('Error listing directory contents', error.message);
            result = false;
        }
    } else if (command === 'up') {
        try {
            const parentDirectory = path.dirname(process.cwd());
            if (parentDirectory !== process.cwd()) {
                process.chdir('..');
                result = true;
            } else {
                console.log('You are already at the root directory');
                result = false;
            }
        } catch (error) {
            console.log('Error going up', error.message);
            result = false;
        }
    } else if (command.startsWith('cat')) {
        try {
            const filePath = command.slice(3).trim(); // Extract the file path
            const fileStream = fs.createReadStream(filePath);

            fileStream.on('data', (chunk) => {
                process.stdout.write(chunk);
            });

            fileStream.on('end', () => {
                result = true;
            });
        } catch (error) {
            console.log('Error reading file', error.message);
        } finally {
            result = false;
        }
    } else if (command.startsWith('add')) {
        try {
            const match = command.match(/^add\s+(.+)$/);
            if (match) {
                const fileName = match[1].trim();
                if (fileName) {
                    const filePath = path.join(process.cwd(), fileName);
                    fs.writeFileSync(filePath, '');
                    console.log(`File "${fileName}" created successfully.`);
                    result = true;
                } else {
                    console.log(
                        'Please provide a valid file name for the "add" command.'
                    );
                    result = false;
                }
            } else {
                console.log('Invalid syntax for the "add" command.');
                result = false;
            }
        } catch (error) {
            console.log('Error creating file', error.message);
            result = false;
        }
    } else if (command.startsWith('rn')) {
        try {
            const match = command.match(/^rn\s+(.+)\s+(.+)$/);
            if (match) {
                const oldFilePath = match[1].trim();
                const newFileName = match[2].trim();

                if (oldFilePath && newFileName) {
                    const oldPath = path.join(process.cwd(), oldFilePath);
                    const newPath = path.join(process.cwd(), newFileName);

                    fs.renameSync(oldPath, newPath);
                    console.log(
                        `File "${oldFilePath}" renamed to "${newFileName}" successfully.`
                    );
                    result = true;
                } else {
                    console.log(
                        'Please provide valid paths for the "rn" command.'
                    );
                    result = false;
                }
            } else {
                console.log('Invalid syntax for the "rn" command.');
                result = false;
            }
        } catch (error) {
            console.log('Error renaming file', error.message);
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
                    console.log(
                        `File "${sourceFilePath}" copied to "${destinationDirectory}" successfully.`
                    );
                    result = true;
                } else {
                    console.log(
                        'Please provide valid paths for the "cp" command.'
                    );
                    result = false;
                }
            } else {
                console.log('Invalid syntax for the "cp" command.');
                result = false;
            }
        } catch (error) {
            console.log('Error copying file', error.message);
            result = false;
        }
    } else if (command.startsWith('mv')) {
        try {
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
                    console.log(
                        `File "${sourceFilePath}" moved to "${destinationDirectory}" successfully.`
                    );
                    result = true;
                } else {
                    console.log(
                        'Please provide valid paths for the "mv" command.'
                    );
                    result = false;
                }
            } else {
                console.log('Invalid syntax for the "mv" command.');
                result = false;
            }
        } catch (error) {
            console.log('Error moving file', error.message);
            result = false;
        }
    } else if (command.startsWith('rm')) {
        try {
            const filePath = command.slice(2).trim(); // Extract the file path
            if (filePath) {
                const fullPath = path.join(process.cwd(), filePath);
                fs.unlinkSync(fullPath);
                console.log(`File "${filePath}" removed successfully.`);
                result = true;
            } else {
                console.log(
                    'Please provide a valid file path for the "rm" command.'
                );
                result = false;
            }
        } catch (error) {
            console.log('Error removing file', error.message);
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
        try {
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
                console.log(`File "${filePath}" not found.`);
                result = false;
            }
        } catch (error) {
            console.log('Error calculating hash', error.message);
            result = false;
        }
    }

    if (command.startsWith('compress')) {
        try {
            const filePath = command.slice(8).trim(); // Extract the file path
            const destinationPath = filePath + '.br'; // Brotli compressed file extension

            const readStream = fs.createReadStream(filePath);
            const writeStream = fs.createWriteStream(destinationPath);

            const brotliStream = zlib.createBrotliCompress();

            // Pipe the read stream through the Brotli compression stream to the write stream
            readStream.pipe(brotliStream).pipe(writeStream);

            writeStream.on('finish', () => {
                console.log(
                    `File "${filePath}" compressed to "${destinationPath}" successfully.`
                );
                result = true;
            });
        } catch (error) {
            console.log('Error compressing file', error.message);
            result = false;
        }
    } else if (command.startsWith('decompress')) {
        try {
            const filePath = command.slice(10).trim();
            const destinationPath = filePath.replace(/\.br$/, '');
            const readStream = fs.createReadStream(filePath);
            const writeStream = fs.createWriteStream(destinationPath);
            const brotliStream = zlib.createBrotliDecompress();
            // Pipe the read stream through the Brotli decompression stream to the write stream
            readStream.pipe(brotliStream).pipe(writeStream);
            writeStream.on('finish', () => {
                console.log(
                    `File "${filePath}" decompressed to "${destinationPath}" successfully.`
                );

                // Calculate hash of original compressed file
                const originalHash = calculateFileHash(filePath);

                // Calculate hash of decompressed file
                const decompressedHash = calculateFileHash(destinationPath);

                // Compare hashes to ensure the integrity of decompression
                if (originalHash === decompressedHash) {
                    console.log('Hashes match. Decompression successful.');
                } else {
                    console.log(
                        'Hashes do not match. Decompression may have issues.'
                    );
                }
                result = true;
            });
        } catch (error) {
            console.log('Error decompressing file', error.message);
            result = false;
        }
    } else {
        result = false;
    }
    return result;
}

rl.on('line', (input) => {
    if (input.trim() === '.exit') {
        console.log(`Thank you for using File Manager, ${username}, goodbye!`);
        rl.close();
        process.exit();
    } else {
        const result = handleCommand(input.trim());
        if (!result) {
            console.log('Invalid input');
        }

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
