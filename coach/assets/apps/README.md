# Coach app icons

Coach shows these icons on shortcut keys. Assets copied from this machine's installed applications unless noted:

- Chrome, Edge, VS Code, Excel, Outlook, Word, PowerPoint, Discord, Explorer, PowerToys Run: associated icon resources from their installed executables.
- Windows: Bootstrap Icons `windows.svg` (MIT), used for Windows system shortcuts.
- Command Palette: `Microsoft.CommandPalette` package `Assets/Square44x44Logo.scale-200.png`.
- Windows Terminal: `Microsoft.WindowsTerminal` package `Images/Square44x44Logo.scale-200.png`.
- Teams: installed `MSTeams` package `Images/TeamsForWorkNewStoreLogo.scale-200.png`.
- Claude: official Claude favicon from `https://claude.ai/favicon.svg`.
- M-Files: official logo asset from `https://developer.m-files.com/User-Experience/Logo/`.

`shortcut_app_icons.json` maps declared application contexts to these assets. Shared shortcuts use the most-used documented application in the 30-day logger data where counts distinguish candidates: Ctrl+C and Ctrl+V show Windows Terminal (260 vs 169 and 371 vs 305 respectively, Terminal vs Browser); Win+Alt+Space shows the dedicated Command Palette icon. Generic browser shortcuts use Edge, the dominant browser in the logger data.
