# Mountain_Guarder
Meadow Guarder's sister game!

***

# How to Play

### Installation
##### Manual Installation
I cannot distribute node.js as I do not own any rights to it, but visiting [their website](https://nodejs.org/) you can download the latest (not LTS) and install it, **checking the box "Automatically install necessary tools"**. Wait for the installation to finish, then [download the code](https://github.com/definitely-nobody-is-here/Mountain_Guarder/archive/refs/heads/master.zip) and unzip it into any folder. Run Config.bat or Config.sh (depending on system). Then simply double-click on Start.bat or Start.sh and the server is running! (those last two sentences don't apply)

To stop the server, type "stop" into the server console.
For help, type "help" into server console. (also doesn't apply)

##### Heroku Installation
[![Deploy](https://www.Herokucdn.com/deploy/button.svg)](https://Heroku.com/deploy?template=https://github.com/definitely-nobody-is-here/Mountain_Guarder)

### Joining the Game
Once the server is started, you can find your computer's name (available in Windows>System>About as "Device name"), or simply search [what's my ip](http://google.com/search?q=whats+my+ip) or click the link. The server console will tell you what port to visit and you can type either the ip address or computer name on the client side **connected to the same network as the host** and then followed by a ":" and then the port number. Example: 111.22.33.444:2000 or hostcomputer:1100. The port will always be 4000.

### Gameplay
Visit the [wiki](https://github.com/definitely-nobody-is-here/Mountain_Guarder/wiki) for more information.

***

# Troubleshooting
#### There are errors
If you are getting errors or something seems broken (missing textures or broken UI) you can [submit a bug report](https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/new?assignees=&labels=bug&template=bug-report.md&title=BUG+-+%5BSummary+here%5D) including a screenshot of the most recent logs and any errors.
#### My Server Crashed
In the case that your server crashes, [submit a bug report](https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/new?assignees=&labels=bug&template=bug-report.md&title=BUG+-+%5BSummary+here%5D) including a screenshot of the most recent logs and any error messages on the client or server.
#### I can't Connect to the Server (ERROR_Connection_Refused)
If you can't connect to the server, verify that:
 - The server is running
 - You have entered the correct port number and hostname
 - You are connected to the same WiFi network as the server
If you have verified all four of the above, try restarting the server. If your server is running on a dedicated server (like Heroku) check that your link is correct.
#### The Server is Slow
There is nothing we can do about this. It could be your connection speed or a slow server unable to run the game at full speed. Press "backslash" ("\\") ingame and in the top-right corner it should list TPS and Ping. If your Ping is high then that is likely the source of your lag. If you TPS is low then the server is lagging. Check that there is nothing eating your computer's resources by opening Task Manager (Windows) by pressing Ctrl+Shift+Esc.

If you can't resolve your problem after trying these solutions or your problem is not on this page, go to the [Issues](https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues) page and [submit a bug report](https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/new?assignees=&labels=bug&template=bug-report.md&title=BUG+-+%5BSummary+here%5D).

***

# Changelog

| Version | Changes                      |
| ------- | ---------------------------- |
| 0.0.1   | <ul><li>Added base game functionality</li></ul> |
| 0.0.2   | <ul><li>Added collisions</li></ul> |
| 0.0.3   | <ul><li>Add projectiles (no textures)</li><li>Fix Heroku deploy</li><li>Add monster code</li><li>Add issue templates</li></ul> |
| 0.0.4   | <ul><li>Add monsters (they follow you around)</li><li>Players and monsters can shoot arrows</li><li><a href="https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/2" target="_blank">Fixed getting stuck in corners of collisions (Issue #2)</a></li><li>Fixed other collision issues</li><li><a href="https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/4" target="_blank">Fixed Heroku deploy again (Issue #4)</a></li></ul> |
| 0.0.5   | <ul><li>Add world</li><li>Add chunk-based positions</li><li>Implemented full map drawing</li><li><a href="https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/4" target="_blank">Fixed Heroku deploy again (Issue #4)</a></li></ul> |
| 0.0.6   | <ul><li><a href="https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/4" target="_blank">Fixed Heroku deploy for the last time (Issue #4)</a></li></ul> |
| 0.0.7   | <ul><li>Added monster spawners</li><li>Expanded map</li><li>Most monsters attack now</li><li>Monsters aggro on players when hit by them or their projectiles</li><li>Added snowballs</li><li>Projectiles can have patterns now</li><li><a href="https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/5" target="_blank">Fixed client not waiting for loading (Issue #5)</a></li><li><a href="https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/7" target="_blank">Projectiles now despawn (Issue #7)</a></li></ul> |
| 0.0.8   | <ul><li>Added diagonal projectile collisions</li><li>Filled in placeholders for some of the UI</li><li>Fixed cherrybombs</li><li>Holding the mouse button now continuously attacks</li><li>Improved snowballs</li><li>Birds and Snow Birds now attack</li></ul> |
| 0.0.9   | <ul><li>Added region name sign</li><li>Expanded map and added "The Tundra" region</li><li>Added death screen</li><li>Cherry Bombs can now trigger and explode other Cherry Bombs</li><li>Snowbirds now throw faster snowballs</li></ul> |
| 0.1.0   | <ul><li>Added menu screen</li><li>Menu screen includes: changelog, announcements, credits/contributors, ads</li><li>Changed "Snowy Tundra" region to have more stuff</li><li>Spacebar can be used to heal and costs Mana</li><li>Added player textures</li><li><a href="https://github.com/definitely-nobody-is-here/Mountain_Guarder/issues/9" target="_blank">Fixed errors in client console (Issue #9)</a></li><li>Fixed monster non-deaggro bug</li><li>Added more placeholders for draggable windows</li><li>Windows now overlap each other in order of last clicked</li><li>Add a little anticheat - respawning while alive kills you</li></ul> |

***

# License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.

Full license can be found in the LICENSE file.

***

# Credits

##### Contributors:
- [Radioactive64](https://github.com/definitely-nobody-is-here) (hey look me!)
- [Maitian-352](https://github.com/maitian352)

##### Resources:
- Various articles on the internet
- [ScriptersWar](https://www.youtube.com/channel/UC8Yp-YagXZ4C5vOduEhcjRw) [tutorial series](https://www.youtube.com/playlist?list=PLcIaPHraYF7k4FbeGIDY-1mZZdjTu9QyL)
- [Meadow Guarder](https://github.com/maitian352/Meadow-Guarder-old)

***

## Want to Contribute?

If you would like to contribute to this game, visit the [Github](https://github.com/definitely-nobody-is-here/Mountain_Guarder) where you can send a pull request with an application request stating your reason to create a pull request in the "comments" section along with it. If you would like to submit a suggestion then too bad there's no suggestion form. The database is NOT publicly accessible for this game. You will have to make your own.