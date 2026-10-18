@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   Hexo One-click Upload to GitHub
echo ============================================
echo   Content publishing = auto commit below.
echo   CODE changes (themes/, scripts/, _config.yml)
echo   should be committed MANUALLY with a proper
echo   message (feat:/fix:/chore:) before running.
echo ============================================

echo [1/4] Cleaning old files...
call npx hexo clean
if errorlevel 1 goto :error

echo [2/4] Generating static files...
call npx hexo generate
if errorlevel 1 goto :error

echo [3/4] Staging changes...
git add -A
git status --short

rem ---- Check if there is anything to commit ----
set "HAS_CHANGES="
for /f "delims=" %%i in ('git status --porcelain') do set "HAS_CHANGES=1"

if not defined HAS_CHANGES (
    echo.
    echo Nothing to commit. Working tree is clean.
    echo All changes already uploaded.
    goto :done
)

rem ---- Warn when code changes are mixed into a content commit ----
set "HAS_CODE="
for /f "delims=" %%f in ('git diff --cached --name-only') do (
    echo %%f | findstr /b /c:"themes/" /c:"scripts/" /c:"_config.yml" >nul && set "HAS_CODE=1"
)
if defined HAS_CODE (
    echo.
    echo *** WARNING: staged changes include CODE files.
    echo *** For a clean history, commit code changes separately
    echo *** with a descriptive message before running this script.
    echo.
    set /p "CONT=Continue anyway? [y/N]: "
    if /i not "!CONT!"=="y" goto :done
)

echo.
echo [4/4] Committing and pushing...
set "DEFAULT_MSG=content: update posts"
set /p "MSG=Commit message [Enter = %DEFAULT_MSG%]: "
if "!MSG!"=="" set "MSG=%DEFAULT_MSG%"

git commit -m "!MSG!" -m "Auto commit %date% %time%"
if errorlevel 1 goto :error

git push origin main
if errorlevel 1 goto :error

echo.
echo ============================================
echo   Upload complete!
echo ============================================
goto :done

:error
echo.
echo   ERROR occurred. Please check the output above.
echo ============================================
exit /b 1

:done
echo.
pause
exit /b 0
