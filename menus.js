import { APPIUM_SESSION_EXTENSION } from "../app/main/helpers";

let menuTemplates = {mac: {}, other: {}};

function languageMenu ({config, i18n}) {
  return config.languages.map((languageCode) => ({
    label: i18n.t(languageCode),
    type: 'radio',
    checked: i18n.language === languageCode,
    click: () => i18n.changeLanguage(languageCode)
  }));
}

function getShowAppInfoClickAction ({dialog, i18n, app}) {
  return () => {
    dialog.showMessageBox({
      title: i18n.t('appiumDesktop'),
      message: i18n.t('showAppInfo', {
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        nodejsVersion: process.versions.node
      }),
    });
  };
}

function macMenuAppium ({dialog, i18n, app, checkNewUpdates, extraMenus}) {
  const menu = {
    label: 'Appium',
    submenu: [{
      label: i18n.t('About Appium'),
      click: getShowAppInfoClickAction({dialog, i18n, app})
    }, {
      label: i18n.t('Check for updates'),
      click () {
        checkNewUpdates(true);
      }
    }, {
      type: 'separator'
    }, {
      label: i18n.t('Hide Appium'),
      accelerator: 'Command+H',
      selector: 'hide:'
    }, {
      label: i18n.t('Hide Others'),
      accelerator: 'Command+Shift+H',
      selector: 'hideOtherApplications:'
    }, {
      label: i18n.t('Show All'),
      selector: 'unhideAllApplications:'
    }, {
      type: 'separator'
    }, {
      label: i18n.t('Quit'),
      accelerator: 'Command+Q',
      click () {
        app.quit();
      }
    }]
  };

  for (const extraMenu of extraMenus) {
    menu.submenu.splice(extraMenu.index, 0, extraMenu.menu);
  }

  return menu;
}

function macMenuEdit ({i18n}) {
  return {
    label: i18n.t('Edit'),
    submenu: [{
      label: i18n.t('Undo'),
      accelerator: 'Command+Z',
      selector: 'undo:'
    }, {
      label: i18n.t('Redo'),
      accelerator: 'Shift+Command+Z',
      selector: 'redo:'
    }, {
      type: 'separator'
    }, {
      label: i18n.t('Cut'),
      accelerator: 'Command+X',
      selector: 'cut:'
    }, {
      label: i18n.t('Copy'),
      accelerator: 'Command+C',
      selector: 'copy:'
    }, {
      label: i18n.t('Paste'),
      accelerator: 'Command+V',
      selector: 'paste:'
    }, {
      label: i18n.t('Select All'),
      accelerator: 'Command+A',
      selector: 'selectAll:'
    }]
  };
}

function macMenuView ({i18n, mainWindow, config}) {
  const submenu = (process.env.NODE_ENV === 'development') ? [{
    label: i18n.t('Reload'),
    accelerator: 'Command+R',
    click () {
      mainWindow.webContents.reload();
    }
  }, {
    label: i18n.t('Toggle Developer Tools'),
    accelerator: 'Alt+Command+I',
    click () {
      mainWindow.toggleDevTools();
    }
  }] : [];

  submenu.push({
    label: i18n.t('Toggle Full Screen'),
    accelerator: 'Ctrl+Command+F',
    click () {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  submenu.push({
    label: i18n.t('Languages'),
    submenu: languageMenu({config, i18n}),
  });

  return {
    label: i18n.t('View'),
    submenu,
  };
}

function macMenuWindow ({i18n}) {
  return {
    label: i18n.t('Window'),
    submenu: [{
      label: i18n.t('Minimize'),
      accelerator: 'Command+M',
      selector: 'performMiniaturize:'
    }, {
      label: i18n.t('Close'),
      accelerator: 'Command+W',
      selector: 'performClose:'
    }, {
      type: 'separator'
    }, {
      label: i18n.t('Bring All to Front'),
      selector: 'arrangeInFront:'
    }]
  };
}

function macMenuHelp ({i18n, shell}) {
  return {
    label: i18n.t('Help'),
    submenu: [{
      label: i18n.t('Learn More'),
      click () {
        shell.openExternal('http://appium.io');
      }
    }, {
      label: i18n.t('Documentation'),
      click () {
        shell.openExternal('https://appium.io/documentation.html');
      }
    }, {
      label: i18n.t('Search Issues'),
      click () {
        shell.openExternal('https://github.com/appium/appium-desktop/issues');
      }
    }, {
      label: i18n.t('Add Or Improve Translations'),
      click () {
        shell.openExternal('https://crowdin.com/project/appium-desktop');
      }
    }]
  };
}

menuTemplates.mac = ({dialog, i18n, app, checkNewUpdates, extraMenus, extraFileMenus, mainWindow, config, shell, shouldShowFileMenu}) => [
  macMenuAppium({dialog, i18n, app, checkNewUpdates, extraMenus}),
  ...(shouldShowFileMenu ? [macMenuFile({i18n, mainWindow, dialog, shouldShowFileMenu, extraFileMenus})]: []),
  macMenuEdit({i18n}),
  macMenuView({i18n, mainWindow, config}),
  macMenuWindow({i18n}),
  macMenuHelp({i18n, shell}),
];

async function openFileCallback (mainWindow, dialog) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {name: 'Appium Session Files', extensions: [APPIUM_SESSION_EXTENSION]}
    ],
  })
  if (!canceled) {
    const filePath = filePaths[0];
    mainWindow.webContents.send('open-file', filePath);
  }
};

async function saveAsCallback (mainWindow, dialog, i18n) {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: i18n.t('saveAs'),
    filters: [{ name: 'Appium', extensions: [APPIUM_SESSION_EXTENSION] }],
  });
  if (!canceled) {
    mainWindow.webContents.send('save-file', filePath);
  }
}

function macMenuFile ({i18n, mainWindow, dialog, extraFileMenus}) {
  let fileSubmenu = [{
    label: i18n.t('Open'),
    accelerator: 'Command+O',
    click: () => openFileCallback(mainWindow, dialog),
  }, {
    label: i18n.t('Save'),
    accelerator: 'Command+S',
    click: () => mainWindow.webContents.send('save-file'),
  }, {
    label: i18n.t('saveAs'),
    accelerator: 'Command+Shift+S',
    click: () => saveAsCallback(mainWindow, dialog, i18n),
  }];

  for (const extraMenu of extraFileMenus) {
    fileSubmenu.splice(extraMenu.index, 0, extraMenu.menu);
  }

  return {
    label: '&'+i18n.t('File'),
    submenu: fileSubmenu,
  };
}

function otherMenuFile ({i18n, dialog, app, mainWindow, checkNewUpdates, extraFileMenus, shouldShowFileMenu}) {
  const fileSavingOperations = [{
    label: i18n.t('Open'),
    accelerator: 'Ctrl+O',
    click: () => openFileCallback(mainWindow, dialog),
  }, {
    label: i18n.t('Save'),
    accelerator: 'Ctrl+S',
    click: () => mainWindow.webContents.send('save-file'),
  }, {
    label: i18n.t('saveAs'),
    accelerator: 'Ctrl+Shift+S',
    click: () => saveAsCallback(mainWindow, dialog, i18n),
  }];

  let fileSubmenu = [
    ...(shouldShowFileMenu ? fileSavingOperations : []),
    {
      label: '&'+i18n.t('About Appium'),
      click: getShowAppInfoClickAction({dialog, i18n, app}),
    }, {
      type: 'separator'
    }, {
      label: '&'+i18n.t('Close'),
      accelerator: 'Ctrl+W',
      click () {
        mainWindow.close();
      }
    }
  ];

  if (shouldShowFileMenu) {
    for (const extraMenu of extraFileMenus) {
      fileSubmenu.splice(extraMenu.index, 0, extraMenu.menu);
    }
  }

  // If it's Windows, add a 'Check for Updates' menu option
  if (process.platform === 'win32') {
    fileSubmenu.splice(1, 0, {
      label: '&'+i18n.t('Check for updates'),
      click () {
        checkNewUpdates(true);
      }
    });
  }


  return {
    label: '&'+i18n.t('File'),
    submenu: fileSubmenu,
  };
}

function otherMenuView ({i18n, mainWindow, config}) {
  const submenu = [];
  submenu.push({
    label: i18n.t('Toggle &Full Screen'),
    accelerator: 'F11',
    click () {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  submenu.push({
    label: i18n.t('Languages'),
    submenu: languageMenu({config, i18n}),
  });

  if (process.env.NODE_ENV === 'development') {
    submenu.push({
      label: '&'+i18n.t('Reload'),
      accelerator: 'Ctrl+R',
      click () {
        mainWindow.webContents.reload();
      }
    });
    submenu.push({
      label: i18n.t('Toggle &Developer Tools'),
      accelerator: 'Alt+Ctrl+I',
      click () {
        mainWindow.toggleDevTools();
      }
    });
  }

  return {
    label: '&'+i18n.t('View'),
    submenu,
  };
}

function otherMenuHelp ({i18n, shell}) {
  return {
    label: i18n.t('Help'),
    submenu: [{
      label: i18n.t('Learn More'),
      click () {
        shell.openExternal('http://appium.io');
      }
    }, {
      label: i18n.t('Documentation'),
      click () {
        shell.openExternal('https://appium.io/documentation.html');
      }
    }, {
      label: i18n.t('Search Issues'),
      click () {
        shell.openExternal('https://github.com/appium/appium-desktop/issues');
      }
    }, {
      label: i18n.t('Add Or Improve Translations'),
      click () {
        shell.openExternal('https://crowdin.com/project/appium-desktop');
      }
    }]
  };
}

menuTemplates.other = ({mainWindow, i18n, dialog, app, checkNewUpdates, config, shell, shouldShowFileMenu, extraFileMenus}) => [
  otherMenuFile({i18n, dialog, app, mainWindow, checkNewUpdates, shouldShowFileMenu, extraFileMenus}),
  otherMenuView({i18n, mainWindow, config}),
  otherMenuHelp({i18n, shell})
];

export function rebuildMenus ({mainWindow, config, Menu, dialog, i18n, app, checkNewUpdates, extraMacMenus, extraFileMenus, extraMacFileMenus, shell, shouldShowFileMenu}) {
  if (!mainWindow) {
    return;
  }

  if (config.platform === 'darwin') {
    const template = menuTemplates.mac({dialog, i18n, app, checkNewUpdates, extraMenus: extraMacMenus, extraFileMenus: extraMacFileMenus, mainWindow, config, shell, shouldShowFileMenu});
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    const template = menuTemplates.other({mainWindow, i18n, dialog, app, extraFileMenus, checkNewUpdates, config, shell, shouldShowFileMenu});
    const menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
  }
}
