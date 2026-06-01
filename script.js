const messageInput = document.getElementById("message");
const encryptPassword = document.getElementById("encrypt-password");
const encryptBtn = document.getElementById("encrypt-btn");
const encryptedOutput = document.getElementById("encrypted-output");

const encryptedInput = document.getElementById("encrypted-input");
const decryptPassword = document.getElementById("decrypt-password");
const decryptBtn = document.getElementById("decrypt-btn");
const decryptedOutput = document.getElementById("decrypted-output");

const copyEncryptedBtn = document.getElementById("copy-encrypted-btn");
const copyDecryptedBtn = document.getElementById("copy-decrypted-btn");

const showEncryptPassword = document.getElementById("show-encrypt-password");
const showDecryptPassword = document.getElementById("show-decrypt-password");

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
}

function fromBase64(base64) {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

async function deriveKey(password, salt) {

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
}

encryptBtn.addEventListener("click", async () => {

    const message = messageInput.value.trim();
    const password = encryptPassword.value;

    if (!message || !password) {
        alert("Please enter a message and password.");
        return;
    }

    try {

        const salt = crypto.getRandomValues(
            new Uint8Array(16)
        );

        const iv = crypto.getRandomValues(
            new Uint8Array(12)
        );

        const key = await deriveKey(
            password,
            salt
        );

        const encryptedData =
            await crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                encoder.encode(message)
            );

        const result = [
            toBase64(salt),
            toBase64(iv),
            toBase64(
                new Uint8Array(encryptedData)
            )
        ].join(".");

        encryptedOutput.value = result;

    } catch (error) {

        console.error(error);
        alert("Encryption failed.");

    }

});

decryptBtn.addEventListener("click", async () => {

    const encryptedText =
        encryptedInput.value.trim();

    const password =
        decryptPassword.value;

    if (!encryptedText || !password) {

        alert(
            "Please enter encrypted text and password."
        );

        return;
    }

    try {

        const parts =
            encryptedText.split(".");

        if (parts.length !== 3) {
            throw new Error(
                "Invalid format"
            );
        }

        const salt =
            fromBase64(parts[0]);

        const iv =
            fromBase64(parts[1]);

        const encryptedData =
            fromBase64(parts[2]);

        const key =
            await deriveKey(
                password,
                salt
            );

        const decrypted =
            await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                encryptedData
            );

        decryptedOutput.value =
            decoder.decode(decrypted);

    } catch (error) {

        console.error(error);

        alert(
            "Wrong password or invalid encrypted message."
        );

    }

});

copyEncryptedBtn.addEventListener("click", async () => {

    if (!encryptedOutput.value) return;

    try {

        await navigator.clipboard.writeText(
            encryptedOutput.value
        );

        messageInput.value = "";
        encryptPassword.value = "";
        encryptedOutput.value = "";

        alert(
            "Encrypted text copied and cleared."
        );

    } catch (error) {

        console.error(error);

        alert(
            "Failed to copy text."
        );

    }

});

copyDecryptedBtn.addEventListener("click", async () => {

    if (!decryptedOutput.value) return;

    try {

        await navigator.clipboard.writeText(
            decryptedOutput.value
        );

        encryptedInput.value = "";
        decryptPassword.value = "";
        decryptedOutput.value = "";

        alert(
            "Decrypted text copied and cleared."
        );

    } catch (error) {

        console.error(error);

        alert(
            "Failed to copy text."
        );

    }

});

showEncryptPassword.addEventListener("click", () => {

    if (
        encryptPassword.type ===
        "password"
    ) {

        encryptPassword.type =
            "text";

        showEncryptPassword.textContent =
            "Hide";

    } else {

        encryptPassword.type =
            "password";

        showEncryptPassword.textContent =
            "Show";

    }

});

showDecryptPassword.addEventListener("click", () => {

    if (
        decryptPassword.type ===
        "password"
    ) {

        decryptPassword.type =
            "text";

        showDecryptPassword.textContent =
            "Hide";

    } else {

        decryptPassword.type =
            "password";

        showDecryptPassword.textContent =
            "Show";

    }

});