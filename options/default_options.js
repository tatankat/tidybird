export const option_defaults = {
  startup: "latest",
  buttonheight: -1,
  buttonmargin: 3,
  showoptionsbutton: true,
  isShowing: true,
  width: 224,

  sortorder_initial: "mostrecent",
  sortorder_parentname: false,
  sortorder_accountname: false,
  groupby_account: false,

  nbfolders: 30,
  folderselection: "mostrecent",
  maxage: 30,
  showneverused: false,
  folderstoshow_default: false,

  Fdefault: 0,
  manualorder: [],
};
export const folderSettingValues = {
  "show": {
    "bitindex": 1,
    "bitmask": 0b11,
    "values": {
      "auto": 0,
      "always": 1,
      "never": 2,
    },
  },
  "pin": {
    "bitindex": 0,
    "bitmask": 0b1,
  },
  "markasread": {
    "bitindex": 3,
    "bitmask": 0b11,
    "values": {
      "no": 0,
      "yes": 1,
      "double": 2,
    }
  }
};
export const calculateFolderSingleSettingValue = function(name, textvalue) {
  let value = 1; // if no "values" in the settingValues, then 1 (checkbox is checked)
  let settingValues = folderSettingValues[name];
  if (settingValues.values !== undefined) {
    value = settingValues.values[textvalue];
  }
  if (value > 0) {
    value = value << settingValues.bitindex
  }
  return value;
}
export const folder_hasSetting = function(settingName, valueName, folderSettingValue) {
  const settingConfiguration = folderSettingValues[settingName];
  const calculatedFolderSettingValue = calculateFolderSingleSettingValue(settingName,valueName);
  const maskedSetting = (folderSettingValue & (settingConfiguration.bitmask << settingConfiguration.bitindex));
  return maskedSetting === calculatedFolderSettingValue;
}
export const folder_doAutoShow = function(settings) {
  return folder_hasSetting("show","auto",settings);
}
export const folder_doAlwaysShow = function(settings) {
  return folder_hasSetting("show","always",settings);
}
export const folder_doNeverShow = function(settings) {
  return folder_hasSetting("show","never",settings);
}
export const folder_isPinned = function(settings) {
  return folder_hasSetting("pin",1,settings);
}
export const getFolderAttributename = function(folder) {
  return encodeURI(`${folder.accountId}${folder.path}`);
}
export const getFolderMRMDeleteKey = function(folder) {
  return "D" + getFolderAttributename(folder); // should come alphabetically before Folder setting
}
// also implemented in options.js
export const getFolderSettingsKey = function(folder) {
  return "F" + getFolderAttributename(folder); // should come alphabetically before MRM setting
};
// also implemented in options.js
export const getFolderMRMSettingsKey = function(folder) {
  return "M" + getFolderAttributename(folder);
};
export const getFolderFromSettingsKey = function(setting) {
  return setting.substring(1);
}
export const getSettingFromInput= function(input) {
  let varParts = input.name.split("_",1);
  return varParts[0];
}
/**
 * Calculate the timestamp like Thunderbird does
 **/
export const getTimestamp = function() {
  // Bitwise Or ) with ZERO converts value to integer by discarding any value after decimal point
  // https://stackoverflow.com/a/75235699
  return Date.now()/1000 | 0;
}
/**
 * Parse a number that was encoded for settings
 **/
export const parseNumber = function(string) {
  return parseInt(string,36);
}
/**
 * Encode an integer to put it in settings
 * as an integer is stored as a string, this takes less 
 **/
export const encodeNumber = function(date) {
  return date.toString(36);
}
/**
 * Parse a date and return it in readable format
 **/
export const parseDate = function(encodedDate) {
  try {
    return new Intl.DateTimeFormat(undefined,{dateStyle:'short',timeStyle:'short'}).format(new Date(parseNumber(encodedDate)*1000));
  } catch (e) {
    console.log("Tidybird error in parseDate",e);
  }
  return null;
}
/**
 * Encode a unix timestamp to put it in settings
 **/
export const encodeDate = function(date) {
  // we encode the unix timestamp with base 36
  // this is more efficient as the integer is stored as an ascii string
  // the timestamp is reduced from 13 to 8 characters
  return encodeNumber(date);
}

/**
 * Execute callback on folder and its subfolders
 **/
const doOnFolders = async function(account, folder, callback) {
  // get subfolders before possibly changing something in the folder object
  //  adding attribute for examples breaks getting subfolders
  const subfolders = await messenger.folders.getSubFolders(folder,false);
  // FIXME from TB >115: filter on canFileMessages
  await callback(folder, account);
  //TODO check code of getting the subfolders directly
  for (let subfolder of subfolders) {
    await doOnFolders(account, subfolder, callback);
  }
}

/**
 * Execute callback function on all folders found
 **/
export const foreachAllFolders = async function(callback) {
  let accounts = await messenger.accounts.list(true);
  for (let account of accounts) {
    // FIXME from TB >115: filter on canFileMessages
    for (let folder of account.folders) {
      //TODO check code of getting the subfolders directly
      await doOnFolders(account, folder, callback);
    }
  }
}

let accountList, groupedFolderList;
export const resetLists = async function() {
  accountList = {}; // reinitialize every time: account may be renamed FIXME act on account rename, as we also may have to update the button list
  groupedFolderList = {}
}
export const getGroupedFolderList = async function() {
  return groupedFolderList;
}

/**
 * Return a folder object usable by the folder webextensions API
 * from the name used in the settings
 **/
const getFolderObjectFromSetting = async function(folderSetting) {
  let folder = decodeURI(getFolderFromSettingsKey(folderSetting));
  let accountSplitIndex = folder.indexOf("/");
  return {
    accountId: folder.substring(0,accountSplitIndex), // for MailFolder "constructor"
    path: folder.substring(accountSplitIndex), // for MailFolder "constructor"
  };
}
/**
 * Get a folder object with tidybird settings, not usable by webextensions API
 **/
export const getTidybirdFolder = function(folderAttributeSetting, MRMTimeSetting, folderSettings) {
  //let time = common.parseNumber(MRMTimeSetting);
  return {
    tidybird_attributename: folderAttributeSetting,
    tidybird_time: MRMTimeSetting,
    tidybird_foldersettings: folderSettings,
  };
}
/**
 * Add tidybird settings to webextensions folder
 **/
export const makeTidybirdFolder = async function(folder) {
  const MRMSettingsKey = getFolderMRMSettingsKey(folder);
  const settings = await messenger.storage.local.get(MRMSettingsKey);
  folder.tidybird_time = settings[MRMSettingsKey];
  return folder;
}
/**
 * Return an eventual semi-expanded folder object
 * from some object containing necessary folder info
 **/
export const getFolderFromInfo = async function(folderInfo) {
  let folder = folderInfo;
  let folderObject = await getFolderObjectFromSetting(folderInfo.tidybird_attributename);
  folder.path = folderObject.path;
  folder.accountId = folderObject.accountId;
  // add other info
  /*
  for (let attributeName in folderInfo) {
    folderObject[attributeName] = folderInfo[attributeName];
  }
  */
  return folder;
}
/**
 * Return the "root" folder to display
 **/
const getRoot = async function(folderFullPath) {
  // ancestor example: [ "<accountname>", "INBOX", "a_folder_in_inbox" ]
  const ancestors = folderFullPath.split("/");
  // TODO make the "2" configurable (?)
  const rootIndex = ancestors.length > 3 ? 2 : ancestors.length - 2;
  // set a "fake" root folder with the account name if there is no folder ancestor
  if (ancestors.length > 2) {
    // The name is not always the same as the path(part)
    //  but we ignore this fact as getting the human readable name
    //  costs just too much TODO do test with many folders
    return ancestors[rootIndex];
  }
  return ancestors[0]; // return account name
}

/**
 * Add additional attributes to the folder
 **/
export const expandFolder = async function(folder) {
  /*
   * either: copy
  for (let attributeName in folderInfo) {
    folderObject[attributeName] = folderInfo[attributeName];
  }
   * or: create object with known attributes
  let expandedFolder = {
    accountId: folder.accountId, // minimal folder object
    path: folder.path, // minimal folder object
    time: folder.time, // for ordening and rearranging when moved to if sorted on MRMTime
    settings: folder.folderSettings,
  };
   * or: change original and create object usable for API where/when necessary
   */
  let expandedFolder = folder;
  let path = expandedFolder.path;
  // We assume here (and in getRoot) the folder names are also path members
  //  as otherwise it would cost too much to get the folder object
  //  to get the folder name and the folder parent name
  //  TODO check this statement when testing a LOT of folders
  let splittedPath = path.split("/");
  expandedFolder.name = splittedPath[splittedPath.length-1];
  expandedFolder.parentName = splittedPath[splittedPath.length-2];
  let accountId = expandedFolder.accountId;
  let account = accountList[accountId];
  if (account == undefined) {
    account = await messenger.accounts.get(accountId);
    accountList[accountId] = account;
  }
  expandedFolder.accountName = account.name; // to show if grouped by account
  let displayPath = account.name + path;
  expandedFolder.rootName = await getRoot(displayPath);
  expandedFolder.displayPath = displayPath;
  expandedFolder.internalPath = encodeURI(accountId + path);
  return expandedFolder;
}

/**
 * First expand the folder and then add folder to a list grouped by:
 * 1) account (if needed)
 * 2) "pinned" and "auto" (sorted) folders
 *
 * Used settings: groupby_account & sortorder_accountname
 **/
export const addToGroupedList = async function(expandedFolder, settings, alreadyExpanded) {
  let listType = "auto";
  if (folder_isPinned(expandedFolder.folderSettings)) {
    listType = "pinned";
  }
  // Add the folder according to the settings, so we can sort if needed
  let accountSortValue;
  if (settings.groupby_account || settings.sortorder_accountname) {
    accountSortValue = expandedFolder.accountId;
    if (settings.sortorder_accountname) {
      accountSortValue = expandedFolder.accountName;
    }
  } else {
    accountSortValue = "folderList";
  }
  if (groupedFolderList[accountSortValue] === undefined) {
    groupedFolderList[accountSortValue] = {
      "pinned": [],
      "auto": [],
    };
  }
  if (listType == "pinned") {
    groupedFolderList[accountSortValue][listType][expandedFolder.internalPath] = expandedFolder;
  } else {
    groupedFolderList[accountSortValue][listType].push(expandedFolder);
  }
}

export const isExpansionNeeded = function(sortorder, alreadyExpanded) {
  if (alreadyExpanded) {
    return false;
  }
  for (const sortby of sortorder) {
    if (!getAttributeSortFunctionNeeds(sortby).startsWith("tidybird_")) {
      return true;
    }
  }
  return false;
}

/*
 * Folder sorting
 */
export const getAttributeSortFunctionNeeds = function(sortby) {
  switch(sortby) {
    case "mostrecent":
      return "tidybird_time";
    case "namecasein":
    case "reversenamecasein":
      return "name";
    case "fullpath":
      // is an encoded fullpath, TODO just make sure all prefixes are the same
      // we use this so an expand is not needed before cutoff
      return "tidybird_attributename";
    case "parentname":
      return "parentName";
    case "accountname":
      return "accountName";
  }
  return null;
}
let collator = new Intl.Collator();
export const getSortFunction = async function(sortby) {
  const attribute = getAttributeSortFunctionNeeds(sortby);
  switch(sortby) {
    case "mostrecent":
      return (a,b) => {
        if  ( a[attribute] === b[attribute] ) {
          return 0;
        }
        // reverse sort
        if (
          ( a[attribute] === undefined && b[attribute] !== undefined )
          ||
          a[attribute] < b[attribute]
        ) {
          return 1;
        }
        return -1;
      };
    case "namecasein":
    case "fullpath":
    case "parentname":
    case "accountname":
      return(a,b) => collator.compare(a[attribute],b[attribute]);
    case "reversenamecasein":
      return(a,b) => collator.compare(b[attribute],a[attribute]);
  }
  return null;
}
/**
 * Returns a sorted array of attributes to sort the folders
 * Occasionally skipping initial sortorder if already done
 **/
export const getFullSortorder = async function(settings,alreadySortedBy) {
  const order = [];
  if (alreadySortedBy === true) {
    // already fully sorted, not doing anything
    return order;
  }
  let changedOrder = false;
  if (settings.sortorder_initial !== "no" && settings.sortorder_initial !== alreadySortedBy) {
    order.push(settings.sortorder_initial);
    changedOrder = true;
  }
  const nextOrders = [ "namecasein", "fullpath", "parentname", "accountname" ];
  for (const nextOrder of nextOrders) {
    if (settings['sortorder_'+nextOrder] && (changedOrder || alreadySortedBy != nextOrder)) {
      order.push(nextOrder);
      changedOrder = true;
    }
  }
  return order;
}
export const sortFoldersBySortorder = async function(folderList,sortorder) {
  for (let sortby of sortorder) {
    folderList.sort(await getSortFunction(sortby));
  }
}
