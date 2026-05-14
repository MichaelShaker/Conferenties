const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

function getKey() {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("ENCRYPTION_KEY or JWT_SECRET is required");
    }

    return crypto.createHash("sha256").update(secret).digest();
}

function encryptText(value) {
    if (!value) return value;

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(String(value), "utf8"),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    return [
        "enc",
        iv.toString("base64"),
        authTag.toString("base64"),
        encrypted.toString("base64")
    ].join(":");
}

function decryptText(value) {
    if (!value || !String(value).startsWith("enc:")) {
        return value;
    }

    const [, ivBase64, authTagBase64, encryptedBase64] = String(value).split(":");
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        getKey(),
        Buffer.from(ivBase64, "base64")
    );

    decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, "base64")),
        decipher.final()
    ]);

    return decrypted.toString("utf8");
}

module.exports = {
    encryptText,
    decryptText
};
