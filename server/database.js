// Copyright (C) 2021 Radioactive64

const bcrypt = require('bcrypt');
const salt = 10;
const {Client} = require('pg');
url = null;
if (process.env.URL) {
    url = process.env.URL;
} else {
    require('./url.js');
}
const connectionString = url;
const database = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

ACCOUNTS = {
    connected: false,
    connect: async function() {
        if (!ACCOUNTS.connected) {
            try {
                await database.connect();
                ACCOUNTS.connected = true;
            } catch (err) {
                forceQuit(err);
            }
        } else {
            warn('Already connected!');
        }
    },
    disconnect: function() {
        if (ACCOUNTS.connected) {
            database.end();
            ACCOUNTS.connected = false;
        } else {
            warn('Not Connected!');
        }
    },
    signup: async function(username, password) {
        if (await getCredentials(username) == false) {
            var status = await writeCredentials(username, password);
            if (status) {
                return 0;
            }
            warn('Failed to sign up!');
            return 2;
        }
        return 1;
    },
    login: async function(username, password) {
        var cred = await getCredentials(username);
        if (cred) {
            if (bcrypt.compareSync(password, cred.password)) {
                return 0;
            }
            return 1;
        }
        return 2;
    },
    logout: async function(username, password, data) {
        var status = await updateProgress(username, password, data);
        if (status) {
            return true;
        }
        warn('Failed to log out!');
        return false;
    },
    deleteAccount: async function(username, password) {
        var cred = await getCredentials(username);
        if (cred) {
            if (bcrypt.compareSync(password, cred.password)) {
                var status = await deleteCredentials(username);
                if (status) {
                    return 0;
                } else {
                    return 3;
                }
            } else {
                return 1;
            }
        }
        return 2;
    },
    changePassword: async function(username, oldpassword, password) {
        var cred = await getCredentials(username);
        if (cred) {
            if (bcrypt.compareSync(oldpassword, cred.password)) {
                var status = await updatePassword(username, password);
                if (status) {
                    return 0;
                } else {
                    return 3;
                }
            } else {
                return 1;
            }
        }
        return 2;
    },
    validateCredentials: function(username, password) {
        if (username != '') {
            if (username.length > 3) {
                if (!username.includes(' ') && !username.includes('\\') && !username.includes('"')) {
                    if (password != '') {
                        if (!password.includes(' ') && !password.includes('\\') && !password.includes('"')) {
                            return 0;
                        } else {
                            return 4;
                        }
                    } else {
                        return 3;
                    }
                } else {
                    return 4;
                }
            } else {
                return 2;
            }
        } else {
            return 1;
        }
    },
    loadProgress: async function(username, password) {
        var progress = await getProgress(username, password);
        if (progress) {
            return progress;
        }
        warn('Failed to load progress!');
        return false;
    },
    saveProgress: async function(username, password, data) {
        var status = await updateProgress(username, password, data);
        if (status) {
            return true;
        }
        warn('Failed to save progress!');
        return false;
    }
};
ACCOUNTS.connect();

// credential read/write
async function getCredentials(username) {
    try {
        var data = await database.query('SELECT username, password FROM users WHERE username=$1;', [username]);
        if (data.rows[0]) {
            return {username: data.rows[0].username, password: data.rows[0].password};
        }
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
async function writeCredentials(username, password) {
    try {
        var encryptedpassword = bcrypt.hashSync(password, salt);
    } catch (err) {
        forceQuit(err, 3);
    }
    try {
        await database.query('INSERT INTO users (username, password) VALUES ($1, $2);', [username, encryptedpassword]);
        return true;
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
async function deleteCredentials(username,) {
    try {
        await database.query('DELETE FROM users WHERE username=$1', [username]);
        return true;
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
async function updatePassword(username, password) {
    try {
        var encryptedpassword = bcrypt.hashSync(password, salt);
    } catch (err) {
        forceQuit(err, 3);
    }
    try {
        await database.query('UPDATE users SET password=$2 WHERE username=$1', [username, encryptedpassword]);
        return true;
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
// progress read/write
async function getProgress(username, password) {
    var cred = await getCredentials(username);
    if (cred) {
        if (bcrypt.compareSync(password, cred.password)) {
            var data = await database.query('SELECT data FROM users WHERE username=$1;', [username]);
            if (data.rows[0]) {
                return data.rows[0].data;
            }
        } else {
            warn('WARNING: Unauthorized attempt to fetch user data!');
        }
    }
    return false;
};
async function updateProgress(username, password, data) {
    var cred = await getCredentials(username);
    if (cred) {
        if (bcrypt.compareSync(password, cred.password)) {
            try {
                database.query('UPDATE users SET progress=$2 WHERE username=$1', [username, data]);
                return true;
            } catch (err) {
                forceQuit(err, 2);
            }
        } else {
            warn('WARNING: Unauthorized attempt to change user data!');
        }
    }
    return false;
};