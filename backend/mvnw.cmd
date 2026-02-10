@REM -------------------------------------------------------------------
@REM Maven Wrapper startup batch script (Windows)
@REM -------------------------------------------------------------------
@IF "%__MVNW_ARG0__%"=="" SET __MVNW_ARG0__=%~0
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE__%PSModuleAutoLoadingPreference%
@SET PSModuleAutoLoadingPreference=
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {$n = Get-Content -Raw '%~dp0.mvn\wrapper\maven-wrapper.properties' | Select-String -Pattern 'distributionUrl=(.*)'; if ($n) {Write-Output ('MVNW_DIST_URL=' + $n.Matches[0].Groups[1].Value.Trim())} }"`) DO @(
    IF /I "%%A"=="MVNW_DIST_URL" SET "MVNW_DIST_URL=%%B"
)
@SET "PSModuleAutoLoadingPreference=%__MVNW_PSMODULEP_SAVE__%"
@SET MVNW_JAVA_COMMAND=java
@IF DEFINED JAVA_HOME SET "MVNW_JAVA_COMMAND=%JAVA_HOME%\bin\java"

@SET WRAPPER_JAR="%~dp0.mvn\wrapper\maven-wrapper.jar"
@IF NOT EXIST %WRAPPER_JAR% (
    powershell -Command "&{$wrapperUrl = (Get-Content -Raw '%~dp0.mvn\wrapper\maven-wrapper.properties' | Select-String -Pattern 'wrapperUrl=(.*)').Matches[0].Groups[1].Value.Trim(); Invoke-WebRequest -Uri $wrapperUrl -OutFile '%~dp0.mvn\wrapper\maven-wrapper.jar'}" 2>NUL
    IF NOT EXIST %WRAPPER_JAR% (
        echo ERROR: Could not download Maven wrapper jar.
        exit /b 1
    )
)

@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain
"%MVNW_JAVA_COMMAND%" ^
  %MVNW_JAVA_OPTS% ^
  "-Dmaven.multiModuleProjectDirectory=%CD%" ^
  -cp %WRAPPER_JAR% ^
  %WRAPPER_LAUNCHER% %*
IF ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%
EXIT /B %ERROR_CODE%
