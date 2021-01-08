/*
	Tidybird extension for Mozilla Thunderbird - Organize email into folders
	quickly and easily.
	
    Copyright (C) 2018 George Anastassakis (ganast@ganast.com)
	
	This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
var EXPORTED_SYMBOLS = [ "Tidybird" ];

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
*/

// folder listener to update button list...
var TidybirdFolderListener = {

	// OnItemAdded, irrelevant in all cases...
    OnItemAdded: function(parentItem, item, view) {
      // TODO -very later- to include Trash & Archive I guess we can use this and generate an MRMTime ourselves, but we should listen to a matching removed(?)
      // console.debug('OnItemAdded: parentItem=' + parentItem.name + ', item=' + item + ', view=' + view);
    },

	// OnItemRemoved, relevant if item removed is a folder...
    OnItemRemoved: function(parentItem, item, view) {
		// Log('OnItemRemoved: parentItem=' + parentItem + ', item=' + item + ', view=' + view);
		// alert('OnItemRemoved: parentItem=' + parentItem + ', item=' + item + ', view=' + view);

		// check if item removed is a folder...
		if (item instanceof Components.interfaces.nsIMsgFolder) {
      // check if we have this folder in the list
      if ( Tidybird.findFolder(item) != -1 ) {
        // update button list...
        Tidybird.updateButtonList();
      }
		}
	},

	// OnItemPropertyChanged, irrelevant in all cases...
    OnItemPropertyChanged: function(item, property, oldValue, newValue) {
		// Log('OnItemPropertyChanged: item=' + item + ', property=' + property + ', oldValue=' + oldValue + ', newValue=' + newValue);
	},

	// OnItemIntPropertyChanged, irrelevant in all cases...
    OnItemIntPropertyChanged: function(item, property, oldValue, newValue) {
		// Log('OnItemIntPropertyChanged: item=' + item + ', property=' + property + ', oldValue=' + oldValue + ', newValue=' + newValue);
	},

	// OnItemBoolPropertyChanged, irrelevant in all cases...
    OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {
		// Log('OnItemBoolPropertyChanged: item=' + item + ', property=' + property + ', oldValue=' + oldValue + ', newValue=' + newValue);
	},

	// OnItemUnicharPropertyChanged, irrelevant in all cases...
    OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {
		// Log('OnItemUnicharPropertyChanged: item=' + item + ', property=' + property + ', oldValue=' + oldValue + ', newValue=' + newValue);
	},

	// OnItemPropertyFlagChanged, irrelevant in all cases...
    OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {
		// Log('OnItemPropertyFlagChanged: item=' + item + ', property=' + property + ', oldFlag=' + oldFlag + ', newFlag=' + newFlag);
	},

	// OnItemEvent, relevant if event signifies that a folder's name or most-
	// recently modified time property has changed...
    OnItemEvent: function(folder, event) {
      //console.debug('OnItemEvent: event=' + event);

      if (event == "FolderLoaded") {
        console.log("a folder loaded");
        if(Tidybird.foldersNotYetLoaded != false) {
          console.log("first folder loaded: updating button list");
          Tidybird.updateButtonList(); // on startup, we wait for a folder to be loaded before adding the folder list
          Tidybird.foldersNotYetLoaded = false;
        }
      }
		// check if a folder has been renamed...
		if (event == "RenameCompleted") {
      // can't find a way to check if the folder was in the list (there is no information in event)
      // if we want to include new folders in the list, then we should also listen to this event
			Tidybird.updateButtonList();
		}

		// else, check if there has been a change in a folder's MRMTime
		// property...
		else if (event == "MRMTimeChanged") {
      // Generating the list can take a long time and blocks the interface...
      // , so we check if we already have the folder
      if ( Tidybird.findFolder(folder) == -1 ) {
        // update button list...
        Tidybird.updateButtonList();
      }
		}
	}
};

// container var for all Tidybird-related stuff...
var Tidybird = {

  foldersNotYetLoaded: true,
  _folders: [],

	// initialization...
	init: function() {
		// Log('[Tidybird] Tidybird.init - begin');

    // add a Tidybird folder listener to the mail session component...
    // all = 0xFFFFFFFF
    // removed = 0x2
    // event = 0x80
    let notifyFlags = Components.interfaces.nsIFolderListener.removed|Components.interfaces.nsIFolderListener.event;
    MailServices.mailSession.AddFolderListener(TidybirdFolderListener, notifyFlags);

		// update button list...
		//Tidybird.updateButtonList(); // wait for a folder to be loaded, otherwise there are no folders to get mrmtime from, probably the servers should be initialized first (but I did not find a way to observ this event)
		
		// Log('[Tidybird] Tidybird.init - end');
	},

  deinit: function() {
    MailServices.mailSession.RemoveFolderListener(TidybirdFolderListener);
  },

  findFolder: function(folder) {
    return Tidybird._folders.indexOf(folder);
  },

  updateButtonList: async function() {
    console.debug("updating button list");
		var buttonList = top.document.getElementById("tidybirdButtonList");
    if(buttonList == null)
    {
      console.warn("No tidybird buttonlist found, while it should have been created.");
      return
    }
		while (buttonList.hasChildNodes()){
      Tidybird._folders.pop();
			buttonList.removeChild(buttonList.firstChild);
		}
		var mostRecentlyModifiedFolders = Tidybird.getMostRecentlyModifiedFolders();
		for (var i = 0; i != mostRecentlyModifiedFolders.length; i++) {
      Tidybird._folders.push(mostRecentlyModifiedFolders[i]);
			var button = Tidybird.createFolderMoveButton(
				mostRecentlyModifiedFolders[i]
			);
			buttonList.appendChild(button);
		}
	},

	createFolderMoveButton: function(folder) {
		
		var ancestors = Tidybird.getFolderAncestors(folder);

		var path = "";
		for (var i = 0; i != ancestors.length; i++) {
			path += ancestors[i].name + "/"
		}
		
		var root = ancestors.length > 2 ?
			ancestors[2] :
			(
				ancestors.length > 1 ? ancestors[1] : ancestors[0]
			);
		
    let button = document.createXULElement("button");
		button.className = "tidybird-folder-move-button";

    let hbox = document.createXULElement("hbox");
		hbox.setAttribute("flex", "1");
		hbox.className = "button-box";
		button.appendChild(hbox);

		// button.textContent = folder.name + " (in " + root.name + ")";

    let label1 = document.createXULElement("label");
		label1.setAttribute("flex", "1");
		label1.className = "tidybird-folder-move-button-label-1";
		label1.textContent = folder.name;
		hbox.appendChild(label1);
		
    let label2 = document.createXULElement("label");
		label2.setAttribute("flex", "1");
		label2.className = "tidybird-folder-move-button-label-2";
		label2.textContent = /*"in " + */root.name;
		hbox.appendChild(label2);
		
		button.setAttribute("tooltiptext", path + folder.name);

		button.addEventListener(
			"click",
			function() {
				Tidybird.moveSelectedMessageToFolder(folder)
			},
			false
		);

		return button;
	},

	moveSelectedMessageToFolder: function(folder) {
		MsgMoveMessage(folder);
	},
	
	getFolderAncestors: function(folder) {
		if (folder.parent != undefined) {
			var parent = folder.parent;
			var ancestors = Tidybird.getFolderAncestors(folder.parent);
			ancestors.push(folder.parent);
			return ancestors;
		}
		else {
			return [];
		}
	},
	
	getMostRecentlyModifiedFolders: function() {
    /*
     * Trash (del) & Archives (a) don't get a MRMTime
     * Drafts & Sent do
     * TODO -very later- let user choose to show them in list (per account)
     * TODO -later- while we are at it: let user choose the number of folders to display
     */
    let allFolders = MailServices.accounts.allFolders.filter( folder => folder.canFileMessages);
    let mostRecentlyModifiedFolders = getMostRecentFolders(
      allFolders,
			30,
			"MRMTime",
		);
		mostRecentlyModifiedFolders.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});
		return mostRecentlyModifiedFolders;
	}
}

