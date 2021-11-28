// Copyright (C) 2021 Radioactive64

// sign in
var deleteaccountconfirmed = false;
var changePasswordActive = false;
var signInError = document.getElementById('signInError');
function signIn() {
    socket.emit('signIn', {
        state: 'signIn',
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    });
};
function createAccount() {
    socket.emit('signIn', {
        state: 'signUp',
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    });
};
function deleteAccount() {
    if (deleteaccountconfirmed) {
        var input = window.prompt('Please enter your password to continue:');
        socket.emit('signIn', {
            state: 'deleteAccount',
            username: document.getElementById('username').value,
            password: input
        });
    } else {
        document.getElementById('deleteAccount').innerText = 'Are you Sure?';
        deleteaccountconfirmed = true;
    }
};
function changePassword() {
    if (changePasswordActive) {
        socket.emit('signIn', {
            state: 'changePassword',
            username: document.getElementById('username').value,
            oldPassword: document.getElementById('password').value,
            password: document.getElementById('newpassword').value
        });
    } else {
        document.getElementById('newpassword').style.display = 'block';
        document.getElementById('newpasswordLabel').style.display = 'block';
        changePasswordActive = true;
    }
};
socket.on('signInState', function(state) {
    switch (state) {
        case 'signedIn':
            document.getElementById('loadingContainer').onanimationend = function() {
                document.getElementById('loadingContainer').style.display = 'none';
            };
            document.getElementById('loadingContainer').style.animationName = 'fadeOut';
            document.getElementById('signinContainer').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            insertChat({style:'color: #00FF00; font-weight: bold;', text: 'Mountain Guarder ' + version});
            break;
        case 'signedUp':
            signInError.style.color = '#00FF00';
            signInError.innerText = 'Successfully signed up!';
            break;
        case 'deletedAccount':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            signInError.style.color = '#00FF00';
            signInError.innerText = 'Account successfully deleted.';
            window.alert('Account successfully deleted.');
            window.location.reload();
            break;
        case 'changedPassword':
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#00FF00';
            signInError.innerText = 'Password successfully changed.';
            window.alert('Password successfully changed.');
            window.location.reload();
            break;
        case 'incorrectPassword':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Incorrect password.';
            break;
        case 'accountExists':
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Account already exists, try a different username.';
            break;
        case 'noAccount':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Account not found!';
            break;
        case 'alreadySignedIn':
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Already signed in, you may not sign in again!';
            break;
        case 'invalidCharacters':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Invalid characters.';
            break;
        case 'shortUsername':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Your username has to be longer than 3 characters.';
            break;
        case 'longUsername':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Your username has to be 20 characters or less.';
            break;
        case 'noUsername':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Please enter a username.';
            break;
        case 'noPassword':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Please enter a password.';
            break;
        case 'invalidSignIn':
            signInError.style.color = '#FF0000';
            signInError.innerText = 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            window.alert('You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!')
            break;
        case 'databaseError':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'DATABASE ERROR. SERVER STOP. YOU SHOULD NOT SEE THIS.';
            console.error('DATABASE ERROR. SERVER STOP. YOU SHOULD NOT SEE THIS.');
            window.alert('DATABASE ERROR. SERVER STOP. YOU SHOULD NOT SEE THIS.');
            break;
        default: 
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Invalid signInState: ' + state;
            console.error('Invalid signInState: ' + state);
            break;
    }
});

// window creator
DraggableWindow = function(id) {
    var self = {
        x: 0,
        y: 0,
        width: 900,
        height: 600,
        open: false,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        window: document.getElementById(id),
        windowBar: document.getElementById(id + 'Bar'),
        windowClose: document.getElementById(id + 'Close'),
        tabs: []
    };
    self.renderWindow = function() {
        self.x = Math.min(Math.max(self.x, 0), window.innerWidth-self.width-2);
        self.y = Math.min(Math.max(self.y, 0), window.innerHeight-self.height-3);
        self.window.style.left = self.x + 'px';
        self.window.style.top = self.y + 'px';
    };
    self.windowBar.onmousedown = function(e) {
        self.offsetX = e.pageX-self.x;
        self.offsetY = e.pageY-self.y;
        self.dragging = true;
        resetZIndex();
        self.window.style.zIndex = 6;
    };
    document.addEventListener('mousemove', function(e) {
        if (self.dragging) {
            self.x = e.pageX-self.offsetX;
            self.y = e.pageY-self.offsetY;
            self.renderWindow();
        }
    });
    document.addEventListener('mouseup', function() {
        self.dragging = false;
    });
    self.windowClose.onclick = function() {
        self.hide();
    };

    self.hide = function() {
        self.window.style.display = 'none';
        self.open = false;
    };
    self.show = function() {
        self.window.style.display = 'block';
        resetZIndex();
        self.window.style.zIndex = 6;
        self.open = true;
    };
    self.toggle = function() {
        if (self.open) {
            self.hide();
        } else {
            self.show();
        }
    }
    self.changeTab = function(tab) {
        for (var i in self.tabs) {
            document.getElementById(self.tabs[i]).style.display = 'none';
        }
        document.getElementById(tab).style.display = '';
    };
    var children = document.getElementById(id + 'Select').children;
    if (children[0]) {
        for (var i in children) {
            const id = children[i].id;
            if (id) {
                self.tabs.push(id.replace('Select', ''));
                children[i].onclick = function() {
                    self.changeTab(id.replace('Select', ''));
                };
            }
        }
        self.changeTab(self.tabs[0]);
    };

    return self;
};
function resetZIndex() {
    document.getElementById('inventory').style.zIndex = 5;
    document.getElementById('settings').style.zIndex = 5;
    document.getElementById('debugConsole').style.zIndex = 5;
};

// menu buttons
var menuopen = false;
function toggleDropdown() {
    if (menuopen) {
        document.getElementById('dropdownMenuItems').style.display = 'none';
        menuopen = false;
    } else {
        document.getElementById('dropdownMenuItems').style.display = 'block';
        menuopen = true;
    }
};
var inventoryWindow = new DraggableWindow('inventory');
var settingsWindow = new DraggableWindow('settings');
debugConsoleWindow = new DraggableWindow('debugConsole');
inventoryWindow.hide = function() {
    inventoryWindow.window.style.display = 'none';
    inventoryWindow.open = false;
    document.getElementById('invHoverTooltip').style.opacity = 0;
};
settingsWindow.width = 500;
settingsWindow.height = 300;
debugConsoleWindow.width = 400;
function openInventory() {
    inventoryWindow.show();
    toggleDropdown();
};
function toggleInventory() {
    inventoryWindow.toggle();
}
function openSettings() {
    settingsWindow.show();
    toggleDropdown();
};
function openDebugConsole() {
    debugConsoleWindow.show();
    toggleDropdown();
};
function toggleDebugConsole() {
    debugConsoleWindow.toggle();
};
function snapWindows() {
    inventoryWindow.renderWindow();
    settingsWindow.renderWindow();
    debugConsoleWindow.renderWindow();
};

// settings
function toggle(setting) {
    settings[setting] = !settings[setting];
    updateSetting(setting);
    saveSettings();
};
function slider(setting) {
    settings[setting] = parseInt(document.getElementById(setting + 'Slider').value);
    updateSetting(setting);
    saveSettings();
};
function updateSetting(setting) {
    var indicatorText = settings[setting];
    switch (setting) {
        case 'fps':
            resetFPS();
            indicatorText += 'fps';
            break;
        case 'renderDistance':
            if (player) updateRenderedChunks();
            break;
        case 'renderQuality':
            resetCanvases();
            drawFrame();
            indicatorText += '%';
            break;
        case 'particles':
            if (settings.particles) {
                indicatorText = 'on';
            } else {
                indicatorText = 'off';
            }
            break;
        case 'chatBackground':
            if (settings.chatBackground) {
                document.getElementById('chatText').style.backgroundColor = '#00000055';
                indicatorText = 'on';
            } else {
                document.getElementById('chatText').style.backgroundColor = '';
                indicatorText = 'off';
            }
            break;
        case 'chatSize':
            document.getElementById('chat').style.width = 20+settings.chatSize*10 + 'vw';
            document.getElementById('chat').style.height = 120+settings.chatSize*20 + 'px';
            document.getElementById('chatText').style.width = 20+settings.chatSize*10 + 'vw';
            document.getElementById('chatText').style.height = 100+settings.chatSize*20 + 'px';
            document.getElementById('chatInput').style.width = 20+settings.chatSize*10 + 'vw';
            indicatorText = settings.chatSize;
            break;
        case 'debug':
            socket.emit('toggleDebug');
            if (settings.debug) {
                indicatorText = 'on';
            } else {
                indicatorText = 'off';
            }
            break;
        default:
            console.error('Invalid setting ' + setting);
            break;
    }
    document.getElementById(setting + 'Indicator').innerText = indicatorText;
};
function saveSettings() {
    var cookiestring = JSON.stringify(settings);
    var date = new Date();
    date.setUTCFullYear(date.getUTCFullYear()+10, date.getUTCMonth(), date.getUTCDate())
    document.cookie = 'settings=' + cookiestring + '; expires=' + date + ';';
};
try {
    cookiesettings = JSON.parse(document.cookie.replace('settings=', ''));
    for (var i in cookiesettings) {
        if (settings[i] != null) settings[i] = cookiesettings[i];
    }
    settings.debug = false;
    document.getElementById('fpsSlider').value = settings.fps;
    document.getElementById('renderDistanceSlider').value = settings.renderDistance;
    document.getElementById('renderQualitySlider').value = settings.renderQuality;
    document.getElementById('particlesToggle').checked = settings.particles;
    document.getElementById('chatBackgroundToggle').checked = settings.chatBackground;
    document.getElementById('chatSizeSlider').value = settings.chatSize;
    updateSetting('fps');
    updateSetting('renderDistance');
    updateSetting('renderQuality');
    updateSetting('particles');
    updateSetting('chatBackground');
    updateSetting('chatSize');
} catch {}