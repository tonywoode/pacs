# Proxy and Cache Tool

# Installation

# Windows

PACS is a local webdav server. We'll need to use a webDAV client to map it. Commercial options like [netdrive](https://netdrive.net/) exist that avoid some of the annoying things about the webDAV client offered by default by Microsoft in Windows 10, but you can use Microsoft's client, just make these registry changes:

  * **Enable basic auth only authentication** 
  nix/macOS/Linux are able to map webDAV folders using http, https with a self-signed certificate, and https with ca-authority signed certificate. That's how the Windows client used to work too, but since Windows 7, Microsoft disallow anything but a ca-authority signed certificate to map a WebDav folder. (This is not made very clear when you attempt to make a mapping!). This is'nt very convenient since we want to map a local server on our own machine. In order to map without a ca-signed certificate, we need to edit the registry as described [here](https://forum.synology.com/enu/viewtopic.php?f=164&t=121882&start=15#p461510) and [here](https://support.netdocuments.com/hc/en-us/articles/205212850-WebDAV-as-a-Mapped-Drive). And [here's](https://support.microsoft.com/en-us/help/2123563/office-application-opens-blank-from-sharepoint-webdav-or-site-when-it) the same guide from microsoft for earlier versions of windows; basically just regedit `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters\BasicAuthLevel` and change the value to `2`.  Once you've changed this key, you'll be able to sucessfully map PACS as a drive without windows suggesting that you've made a syntax error

  * **Increase the filesize limit on transfers to the maximum available** 
  Microsoft have a very silly default 50MB largest-filesize limit, WebDAV allows a maximum of 4GB. The solution, as described [here](https://answers.microsoft.com/en-us/ie/forum/ie8-windows_xp/error-0x800700df-the-file-size-exceeds-the-limit/d208bba6-920c-4639-bd45-f345f462934f) and [here](https://community.wd.com/t/error-0x800700df-the-file-size-exceeds-the-limit-allowed/91973/4) is to regedit to `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters\FileSizeLimitInBytes` and change the decimal value to `429496729`, and restart

  * allow folders with a large number of files to satsfy a PROPFIND using the windows client - WIP!
  
# MacOS
The MaxOS native WebDav client is cripplingly slow by default, this may be due to initating a new TCP connection for every request. i didn't get far enough in my investigations to check if using PACS would cure this (it certainly does for the Windows client!). Another compounding factor is the constant propfinds for _DS.Store-type files, which can cause HTTP-hangups. Its highly advisable to use a different client 


