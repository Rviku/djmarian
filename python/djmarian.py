from ts3plugin import ts3plugin

import ts3lib, ts3defines
import urllib.request

class testplugin(ts3plugin):
    name = "DJMarian"
    requestAutoload = False
    version = "1.0"
    apiVersion = 21
    author = "Jakub \"Rvik\" Pawlowski"
    description = "Bot control"
    offersConfigure = True
    commandKeyword = ""
    infoTitle = ""
    menuItems = []#[(ts3defines.PluginMenuType.PLUGIN_MENU_TYPE_CLIENT, 0, "text", "icon.png")]
    hotkeys = []#[("keyword", "description")]

    def __init__(self):
        ts3lib.printMessageToCurrentTab("Poprawiam wasa!")

    def stop(self):
        ts3lib.printMessageToCurrentTab("Tylko nie w wasa!")

    def onTextMessageEvent(self, schid, targetMode, toID, fromID, fromName,
                           fromUniqueIdentifier, message, ffIgnored):
        response = urllib.request.urlopen("http://localhost:3000/ping").read()
        ts3lib.printMessageToCurrentTab(response)