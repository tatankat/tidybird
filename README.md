Tidybird extension for Mozilla Thunderbird - Organize email into folders quickly
and easily.

# Introduction

Welcome to Tidybird, an extension for Mozilla Thunderbird that helps you
maintain a tidy mailbox. You need Tidybird if you:

- receive loads of email,

- cannot automatically organize all of it using mail filters,

- want to maintain a tidy mailbox.

Tidybird provides you with a list of buttons using which you can move email into
folders quickly and easily. The list is generated and updated dynamically based
on which folders have been used most recently. In that sense, Tidybird resembles
the built-in recent folders list which you can use via menus to move email to
folders. However, there are some important differences:

- Tidybird is easily accessible as a side panel which you can show and hide as
  needed. It does not require navigation through menus.

- Tidybird allows you to move email by clicking on buttons instead of selecting
  menu items. Tidybird's buttons are larger, better separated and easier to
  target.

- Tidybird provides buttons for 30 recently-used folders. The built-in recent
  folders list only lists 15 folders.

- Tidybird helps you identify the right button for a folder, which is especially
  useful if you have many folders with the same name. In particular, Tidybird
  buttons also display parent folders three levels down from the top as well as
  the full path to folders as tooltips.

The rationale behind the last point is that a folder is, in most cases, easier
to identify if it can be visually associated with a parent folder that is
uniquely identifiable itself.

# Usage

First, add the Tidybird icon to the mail toolbar (right-click on the toolbar,
select "Customize" and drag the Tidybird icon to the desired location on the
toolbar).

Click on the Tidybird icon on the mail toolbar to show and hide the Tidybird
panel. The Tidybird panel can be resized horizontally and its width persists
between sessions.

Click on Tidybird buttons to move the selected message or messages to folders.
The button list contains buttons for the 30 most recently-used folders and is
updated dynamically as you move email to folders in any way (via menus,
drag-and-drop, etc.) and .

To choose the right button, check the parent folder displayed on each button.
This can be better illustrated with an example. Consider the following folder
hierarchy:

- tidybird@example.com
    - Inbox
      - Personal
        - Movies
        - Music
        - News
      - Work
        - Meetings
        - News
- Local Folders
    - Movies
    - Music
    - News

Given the above hierarchy, Tidybird will display folders and parent folders as
follows (parent folders in parentheses):

1.  Inbox (tidybird@example.com)
2.  Personal (Inbox)
3.  Movies (Personal)
4.  Music (Personal)
5.  News (Personal)
6.  Work (Inbox)
7.  Meetings (Work)
8.  News (Work)
9.  Movies (Local Folders)
10. Music (Local Folders)
11. News (Local Folders)

As you can see, in the above example it is quite straightforward to distinguish,
for instance, Movies under tidybird@example.com/Inbox/Personal (3) from Movies
under Local Folders (9). It is equally straightforward to distinguish between
News under tidybird@example.com/Inbox/Personal (5) from News under
tidybird@example.com/Inbox/Work (8). This way, Tidybird helps you distinguish
between folders with the same name under different accounts, different top level
folders, etc.

When this is not enough, a tooltip with the full folder path will do the trick.

# Necessary permissions

As Tidybird uses some Experimental API calls, it still needs full access permissions.
Once the necessary API methods are implemented in Thunderbird, Tidybird will need these permissions (also added are some permissions needed as implemented now):
- storage: storage API - read and save Tidybird settings
- accountsRead (folderManager):
    - Experimental API - convert folder from event to MailExtensions folder
    - messages API - get the folder of a message
- messagesRead (messageManager):
    - Experimental API - convert item from event to MailExtensions message header
    - messageDisplay API - get the currently displayed message
    - getSelectedMessages - get the currenlty selected messages
    - continueList - continue the list of messages to the next page
- accountsFolders: accounts API - get name and full path to a folder
- messagesMove: move messages to a folder
- theme: read theme colors to apply to buttons

# License

Copyright (C) 2021 George Anastassakis (ganast@ganast.com)

Tidybird is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program. If not, see <http://www.gnu.org/licenses/>.

# Contact

Please send comments, suggestions, feature requests, bug reports, etc., to the
author at ganast@ganast.com.
