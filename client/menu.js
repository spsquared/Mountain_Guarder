// Copyright (C) 2021 Radioactive64

// sign in
var deleteaccountconfirmed = false;
var changePasswordActive = false;
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
            document.getElementById('signinContainer').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            insertChat({style:'color: #00FF00; font-weight: bold;', text: 'Mountain Guarder ' + version});
            break;
        case 'signedUp':
            window.alert('Successfully signed up!');
            socket.emit('signIn', {
                state: 'signIn',
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            });
            break;
        case 'deletedAccount':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            window.alert('Account successfully deleted.');
            window.location.reload();
            break;
        case 'changedPassword':
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            window.alert('Password successfully changed');
            window.location.reload();
            break;
        case 'incorrectPassword':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            window.alert('Incorrect password.');
            break;
        case 'accountExists':
            window.alert('Account already exists!');
            break;
        case 'noAccount':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            window.alert('Account not found!');
            break;
        case 'alreadySignedIn':
            window.alert('Already signed in, you may not sign in again!');
            break;
        case 'invalidCharacters':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            window.alert('Invalid characters!');
            break;
        case 'shortUsername':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            window.alert('Your username has to be longer than 3 characters.');
            break;
        case 'noUsername':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            window.alert('Please enter a username.');
            break;
        case 'noPassword':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            window.alert('Please enter a password.');
            break;
        case 'databaseError':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            console.error('DATABASE ERROR. SERVER STOP. YOU SHOULD NOT SEE THIS.');
            window.alert('DATABASE ERROR. SERVER STOP. YOU SHOULD NOT SEE THIS.');
            break;
        default: 
            console.error('Invalid signInState: ' + state);
            document.getElementById('signInError').innerText = 'Invalid signInState: ' + state;
            break;
    }
});

// window creator
DraggableWindow = function(id) {
    var self = {
        x: 0,
        y: 0,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        window: document.getElementById(id),
        windowBar: document.getElementById(id + 'Bar'),
        windowClose: document.getElementById(id + 'Close'),
        tabs: []
    };
    self.renderWindow = function() {
        self.window.style.left = self.x + 'px';
        self.window.style.top = self.y + 'px';
    };
    self.windowBar.onmousedown = function(e) {
        self.offsetX = e.pageX - self.x;
        self.offsetY = e.pageY - self.y;
        self.dragging = true;
        resetZIndex();
        self.window.style.zIndex = 6;
    };
    document.addEventListener('mousemove', function(e) {
        if (self.dragging) {
            self.x = Math.min(Math.max(e.pageX-self.offsetX, 0), window.innerWidth-902);
            self.y = Math.min(Math.max(e.pageY-self.offsetY, 0), window.innerHeight-603);
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
    };
    self.show = function() {
        self.window.style.display = 'block';
        resetZIndex();
        self.window.style.zIndex = 6;
    };
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
    };
    self.changeTab(self.tabs[0]);

    return self;
};
function resetZIndex() {
    document.getElementById('inventory').style.zIndex = 5;
    document.getElementById('settings').style.zIndex = 5;
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
function openInventory() {
    inventoryWindow.show();
    toggleDropdown();
};
function openSettings() {
    settingsWindow.show();
    toggleDropdown();
};

// settings
function toggle(setting) {
    settings[setting] = !settings[setting];
    if (setting == 'debug') socket.emit('toggleDebug');
    saveSettings();
};
function slider(setting) {
    settings[setting] = parseInt(document.getElementById(setting + 'Slider').value);
    if (setting == 'renderDistance') updateRenderedChunks();
    if (setting == 'renderQuality') resetCanvases();
    saveSettings();
};
function saveSettings() {
    var cookiestring = JSON.stringify(settings);
    var date = new Date();
    date.setUTCFullYear(date.getUTCFullYear()+10, date.getUTCMonth(), date.getUTCDate())
    document.cookie = 'settings=' + cookiestring + '; expires=' + date + ';';
};