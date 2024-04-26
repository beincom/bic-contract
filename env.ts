import 'dotenv/config';

export type Environment = {
    API_KEY: string;
    PRIVATE_KEY: string;
    MNEMONIC: string;
    MNEMONIC_PASSPHRASE: string;
    PRIVATE_KEYS: string[];
}

const env = (): Environment => {
    const privateKeys = process.env.PRIVATE_KEYS?.split(",").filter(e => e);
    return {
        API_KEY: process.env.API_KEY as string,
        MNEMONIC: process.env.MNEMONIC as string,
        PRIVATE_KEY: process.env.PRIVATE_KEY as string,
        MNEMONIC_PASSPHRASE: process.env.MNEMONIC_PASSPHRASE as string,
        PRIVATE_KEYS: privateKeys || [],
    }
};

export default env();
