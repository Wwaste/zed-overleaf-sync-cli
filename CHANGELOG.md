# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - Improved User Experience
- **Enhanced Login Flow**: Added interactive Git token prompt during login
  - Clear step-by-step instructions for obtaining Git authentication token
  - Token format validation (checks for `olp_` prefix)
  - Optional skip for free users
  - Detailed troubleshooting tips in case of login failures
  
- **Smart Git Integration**: Improved Git clone functionality
  - Automatically checks for Git token before attempting clone
  - Constructs authenticated Git URL: `https://git:TOKEN@git.overleaf.com/PROJECT_ID`
  - Renames `origin` remote to `overleaf` for clarity
  - Provides helpful error messages with link to token settings
  - Graceful fallback to direct download if Git fails

- **Enhanced Sync Script**: Improved `overleaf-sync` command
  - Prioritizes Git pull for Premium users with configured repositories
  - Automatically falls back to ZIP download if Git sync fails
  - Clearer progress messages and status indicators

### Changed
- **CLI Prompts**: All credential inputs now have detailed, user-friendly prompts
  - Cookie acquisition: Step-by-step browser console instructions
  - Git token: Direct link to Overleaf settings page
  - Format examples for better validation feedback
  
- **Configuration Storage**: Git token now stored in config file
  - Format: `~/.overleaf-zed/config.json` includes `gitToken` field
  - Used automatically by all Git-based operations

### Fixed
- **Git Authentication**: Fixed Git clone failures for Premium users
  - Previously: Git URL didn't include authentication token
  - Now: Properly constructs authenticated URL with token
  - Token is read from stored configuration

### Documentation
- **Updated GETTING-STARTED.md**: Added comprehensive login flow documentation
  - Two-step login process (cookie + optional Git token)
  - Clear distinction between required and optional steps
  - Examples of actual CLI prompts users will see

## Benefits for Users

### For Free Users
- ✅ Clear indication that Git token is optional
- ✅ No confusing Git failures - direct download works perfectly
- ✅ Full functionality without Premium features

### For Premium Users  
- ✅ One-time Git token setup during login
- ✅ Seamless Git-based sync (faster and more reliable)
- ✅ Proper Git remote configuration (`overleaf` remote)
- ✅ Can use standard Git commands (`git pull overleaf master`)

### For All Users
- ✅ No more guessing what credentials are needed
- ✅ Clear error messages with actionable solutions
- ✅ Step-by-step instructions right in the terminal
- ✅ Format validation with helpful examples

## Technical Details

### Files Modified

1. **server/cli.js**
   - `loginCommand()`: Added Git token prompt with validation
   - `cloneWithGit()`: Now uses stored Git token for authentication
   - `setupCommand()`: Passes config to `cloneWithGit()`

2. **tools/sync**
   - Added Git pull attempt before ZIP download fallback
   - Checks `useGit` flag in project metadata
   - Verifies `overleaf` remote exists before pulling

3. **GETTING-STARTED.md**
   - Updated login section with detailed prompts
   - Added visual examples of CLI output
   - Clarified Premium vs Free user workflows

### Security Notes

- Git tokens are stored locally in `~/.overleaf-zed/config.json`
- Token format: `olp_` prefix followed by alphanumeric characters
- Tokens are never logged or displayed in console output
- Cookie and token are only transmitted over HTTPS to Overleaf servers

---

## Previous Versions

See Git history for changes before this documentation was created.
